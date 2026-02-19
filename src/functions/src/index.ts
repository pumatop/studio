"use server";
import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onValueCreated, onValueWritten} from "firebase-functions/v2/database";
import {logger} from "firebase-functions/v2";

admin.initializeApp();
const db = admin.database();

interface Condition {
  type: "time" | "amount";
  value: string | number;
  targetRate: number;
}

/**
 * Checks for time-based exchange rate conditions every minute.
 * This function runs if 'autoConditionsActive' is true, regardless of exchange status.
 */
export const processScheduledRateChanges = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "asia-southeast1",
  },
  async () => {
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();

    // This function only runs if automatic conditions are enabled.
    if (!settings?.autoConditionsActive || !settings.conditions) {
      logger.info("Automatic rate conditions are disabled or no conditions found.");
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const conditions = settings.conditions as Record<string, Condition>;
    const updates: Record<string, unknown> = {};
    let rateChanged = false;

    for (const [id, condition] of Object.entries(conditions)) {
      if (condition.type === "time" && condition.value === currentTime) {
        logger.info(
          `Time condition met for ID ${id}. Changing rate to ${condition.targetRate}`
        );

        updates["/settings/exchangeControl/currentRate"] = condition.targetRate;

        const logId = db.ref("/exchangeRateLogs").push().key;
        updates[`/exchangeRateLogs/${logId}`] = {
          date: now.toISOString(),
          modifiedBy: "النظام التلقائي",
          oldRate: settings.currentRate,
          newRate: condition.targetRate,
          currencyPair: "LYD/EGP",
        };
        updates[`/settings/exchangeControl/conditions/${id}`] = null;
        rateChanged = true;
        break; // Process one time-based condition per minute
      }
    }

    if (rateChanged) {
      await db.ref().update(updates);
      logger.log("Successfully applied time-based rate change.");
    } else {
      logger.info("No time-based conditions met at this time.");
    }

    return;
  }
);

/**
 * Checks for amount-based exchange rate conditions on new transactions.
 * This function runs if 'autoConditionsActive' is true, regardless of exchange status.
 */
export const processTransactionBasedRateChanges = onValueCreated(
  {
    ref: "/transactions/{transactionId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const transaction = event.data.val();

    if (
      transaction.type !== "egypt_transfer" ||
      transaction.status !== "completed"
    ) {
      return;
    }

    // Update the daily aggregate first. This will trigger the auto-close function if needed.
    const date = new Date(transaction.timestamp).toISOString().split("T")[0];
    const aggregateRef = db.ref(`/dailyAggregates/${date}`);
    const {committed, snapshot: aggSnap} = await aggregateRef.transaction(
      (currentData) => {
        if (currentData === null) {
          return {totalEgpAmount: transaction.amountEGP};
        }
        return {
          totalEgpAmount: currentData.totalEgpAmount + transaction.amountEGP,
        };
      }
    );

    if (!committed) {
      logger.error(
        "Failed to commit transaction to update daily aggregate."
      );
      return;
    }
    
    // Now, check for rate change conditions
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();

    if (!settings?.autoConditionsActive || !settings.conditions) {
      logger.info("Automatic rate conditions disabled or no conditions exist.");
      return;
    }

    const amountConditions = Object.entries(
      settings.conditions as Record<string, Condition>
    )
      .filter(([, cond]) => cond.type === "amount")
      .sort(([, a], [, b]) => (a.value as number) - (b.value as number));

    if (amountConditions.length === 0) {
      logger.info("No amount-based rate conditions to check.");
      return;
    }

    const newTotalAmount = aggSnap.val().totalEgpAmount;
    logger.info(`New total EGP amount for ${date} is ${newTotalAmount}. Checking for rate changes.`);

    let rateChanged = false;
    const updates: Record<string, unknown> = {};

    for (const [id, condition] of amountConditions) {
      if (newTotalAmount >= (condition.value as number)) {
        logger.info(
          `Amount-based rate condition met for ID ${id}. ` +
            `New total ${newTotalAmount} >= ${condition.value}. ` +
            `Changing rate to ${condition.targetRate}`
        );

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
        break; // Apply only the first threshold met
      }
    }

    if (rateChanged) {
      await db.ref().update(updates);
      logger.log("Successfully applied amount-based rate change.");
    }

    return;
  }
);


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
            await settingsRef.update({ isOpen: false });
        }
        return;
    }
);
