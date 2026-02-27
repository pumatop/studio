import { onValueWritten } from "firebase-functions/v2/database";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const handleAutoExchangeStatus = onValueWritten(
  {
    ref: "/dailyAggregates/{date}",
    region: "asia-southeast1",
  },
  async (event) => {
    const db = admin.database();
    const settingsSnap = await db.ref("/settings/exchangeControl").get();
    const settings = settingsSnap.val();

    if (settings?.mode !== "auto" || !settings.isOpen) return;

    const aggregate = event.data.after.val();
    if (!aggregate || typeof aggregate.totalEgpAmount === "undefined") return;

    if (aggregate.totalEgpAmount >= settings.autoCloseThreshold) {
      await db.ref("/settings/exchangeControl").update({ isOpen: false });
    }
  }
);