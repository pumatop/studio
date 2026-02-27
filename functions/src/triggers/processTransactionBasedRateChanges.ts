import { onValueCreated } from "firebase-functions/v2/database";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const processTransactionBasedRateChanges = onValueCreated(
  {
    ref: "/users/{userId}/transactions/{transactionId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const transaction = event.data.val();
    if (transaction.type !== "egypt_transfer" || transaction.status !== "completed") return;

    const db = admin.database();
    const date = new Date(transaction.timestamp).toISOString().split("T")[0];
    const aggregateRef = db.ref(`/dailyAggregates/${date}`);

    const { snapshot: aggSnap } = await aggregateRef.transaction((current) => {
      if (current === null) return { totalEgpAmount: transaction.amountEGP };
      return { totalEgpAmount: current.totalEgpAmount + transaction.amountEGP };
    });

    const settingsSnap = await db.ref("/settings/exchangeControl").get();
    const settings = settingsSnap.val();

    if (!settings?.autoConditionsActive || !settings.conditions) return;

    const newTotal = aggSnap.val().totalEgpAmount;
    const amountConditions = Object.entries(settings.conditions)
      .filter(([, c]: any) => c.type === "amount")
      .sort(([, a]: any, [, b]: any) => a.value - b.value);

    for (const [id, cond] of amountConditions as any) {
      if (newTotal >= cond.value) {
        const updates: any = {};
        updates["/settings/exchangeControl/currentRate"] = cond.targetRate;
        updates[`/exchangeRateLogs/${db.ref("/exchangeRateLogs").push().key}`] = {
          date: new Date().toISOString(),
          modifiedBy: "النظام التلقائي",
          oldRate: settings.currentRate,
          newRate: cond.targetRate,
          currencyPair: "LYD/EGP",
        };
        updates[`/settings/exchangeControl/conditions/${id}`] = null;
        await db.ref().update(updates);
        break;
      }
    }
  }
);