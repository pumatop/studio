import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

export const processscheduledratechanges = onSchedule({
  schedule: "every 1 minutes",
  region: "asia-southeast1",
}, async () => {
  const settingsSnap = await db.ref("/settings/exchangeControl").get();
  const settings = settingsSnap.val();

  if (!settings?.autoConditionsActive || !settings.conditions) return;

  const userTimezone = settings.timezone || "UTC";
  const now = new Date();
  const currentTime = now.toLocaleTimeString("en-GB", {
    timeZone: userTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const conditions = settings.conditions;
  const updates: any = {};
  let rateChanged = false;

  for (const [id, condition] of Object.entries(conditions as any)) {
    if (condition.type === "time" && condition.value === currentTime) {
      updates["/settings/exchangeControl/currentRate"] = condition.targetRate;
      const logId = db.ref("/exchangeRateLogs").push().key;
      updates[`/exchangeRateLogs/${logId}`] = {
        date: new Date().toISOString(),
        modifiedBy: "النظام التلقائي",
        oldRate: settings.currentRate,
        newRate: condition.targetRate,
        currencyPair: "LYD/EGP",
      };
      updates[`/settings/exchangeControl/conditions/${id}`] = null;
      rateChanged = true;
      break;
    }
  }

  if (rateChanged) await db.ref().update(updates);
});
