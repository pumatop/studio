import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const processScheduledRateChanges = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "asia-southeast1",
  },
  async () => {
    const db = admin.database();
    const settingsSnap = await db.ref("/settings/exchangeControl").get();
    const settings = settingsSnap.val();

    if (!settings?.autoConditionsActive || !settings.conditions) return;

    const userTimezone = settings.timezone || "UTC";
    const currentTime = new Date().toLocaleTimeString("en-GB", {
      timeZone: userTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });

    const conditions = settings.conditions;
    for (const [id, cond] of Object.entries(conditions) as any) {
      if (cond.type === "time" && cond.value === currentTime) {
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