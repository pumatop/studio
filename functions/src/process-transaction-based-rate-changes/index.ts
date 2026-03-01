import { onValueCreated } from "firebase-functions/v2/database";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

export const processtransactionbasedratechanges = onValueCreated({
  ref: "/users/{userId}/transactions/{transactionId}",
  region: "asia-southeast1",
}, async (event) => {
  const transaction = event.data.val();
  if (transaction.type !== "egypt_transfer" || transaction.status !== "completed") return;

  const date = new Date(transaction.timestamp).toISOString().split("T")[0];
  const aggregateRef = db.ref(`/dailyAggregates/${date}`);
  
  const { committed, snapshot: aggSnap } = await aggregateRef.transaction((current) => {
    if (current === null) return { totalEgpAmount: transaction.amountEGP };
    return { totalEgpAmount: current.totalEgpAmount + transaction.amountEGP };
  });

  if (!committed) return;

  const settingsSnap = await db.ref("/settings/exchangeControl").get();
  const settings = settingsSnap.val();
  if (!settings?.autoConditionsActive || !settings.conditions) return;

  const newTotal = aggSnap.val().totalEgpAmount;
  const updates: any = {};
  let rateChanged = false;

  const amountConditions = Object.entries(settings.conditions as any)
    .filter(([, c]: any) => c.type === "amount")
    .sort(([, a]: any, [, b]: any) => a.value - b.value);

  for (const [id, condition] of amountConditions) {
    if (newTotal >= (condition as any).value) {
      updates["/settings/exchangeControl/currentRate"] = (condition as any).targetRate;
      const logId = db.ref("/exchangeRateLogs").push().key;
      updates[`/exchangeRateLogs/${logId}`] = {
        date: new Date().toISOString(),
        modifiedBy: "النظام التلقائي",
        oldRate: settings.currentRate,
        newRate: (condition as any).targetRate,
        currencyPair: "LYD/EGP",
      };
      updates[`/settings/exchangeControl/conditions/${id}`] = null;
      rateChanged = true;
      break;
    }
  }

  if (rateChanged) await db.ref().update(updates);
});
