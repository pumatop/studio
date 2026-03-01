import { onValueWritten } from "firebase-functions/v2/database";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

export const handleautoexchangestatus = onValueWritten(
  {
    ref: "/dailyAggregates/{date}",
    region: "asia-southeast1",
  },
  async (event) => {
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();

    if (settings?.mode !== "auto" || !settings.isOpen) {
      logger.info("Auto-close is disabled (mode is not 'auto' or exchange is already closed).");
      return;
    }

    const aggregate = event.data.after.val();
    if (!aggregate || typeof aggregate.totalEgpAmount === "undefined") {
      logger.info("No aggregate data found to process for auto-close check.");
      return;
    }
    const newTotalAmount = aggregate.totalEgpAmount;

    if (newTotalAmount >= settings.autoCloseThreshold) {
      logger.info(`Auto-close threshold met. Total: ${newTotalAmount}, Threshold: ${settings.autoCloseThreshold}. Closing exchange.`);
      await settingsRef.update({ isOpen: false });
    }
    return;
  }
);