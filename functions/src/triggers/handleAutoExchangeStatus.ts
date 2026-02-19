import * as admin from "firebase-admin";
import {onValueWritten} from "firebase-functions/v2/database";
import {logger} from "firebase-functions/v2";

const db = admin.database();

/**
 * Automatically closes the exchange based on daily trading volume.
 * This function only runs if the exchange mode is 'auto'.
 */
export const handleAutoExchangeStatus = onValueWritten(
  {
    ref: "/dailyAggregates/{date}",
    region: "asia-southeast1",
  },
  async (event) => {
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();

    // Only run if mode is 'auto' and exchange is currently open.
    if (settings?.mode !== "auto" || !settings.isOpen) {
      logger.info(
        "Auto-close is disabled (mode is not 'auto' or exchange is already closed)."
      );
      return;
    }

    // Get the total amount for the day from the trigger event's 'after' state.
    const aggregate = event.data.after.val();
    if (!aggregate || typeof aggregate.totalEgpAmount === "undefined") {
      logger.info("No aggregate data found to process for auto-close check.");
      return;
    }
    const newTotalAmount = aggregate.totalEgpAmount;

    // Check if the threshold is met.
    if (newTotalAmount >= settings.autoCloseThreshold) {
      logger.info(
        `Auto-close threshold met. Total: ${newTotalAmount}, Threshold: ${settings.autoCloseThreshold}. Closing exchange.`
      );
      // Close the exchange by setting isOpen to false.
      await settingsRef.update({isOpen: false});
    }
    return;
  }
);
