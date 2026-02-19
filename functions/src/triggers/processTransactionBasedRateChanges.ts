import * as admin from "firebase-admin";
import {onValueCreated} from "firebase-functions/v2/database";
import {logger} from "firebase-functions/v2";

const db = admin.database();

interface Condition {
  type: "time" | "amount";
  value: string | number;
  targetRate: number;
}

/**
 * Checks for amount-based exchange rate conditions on new transactions.
 * This function runs if 'autoConditionsActive' is true.
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
