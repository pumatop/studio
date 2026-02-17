import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Admin SDK
admin.initializeApp();
const db = admin.database();

/**
 * A scheduled function that runs every minute to check for time-based exchange rate conditions.
 */
export const processScheduledRateChanges = functions
  .region("asia-southeast1") // Match the database region
  .pubsub.schedule("every 1 minutes")
  .onRun(async (context) => {
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();

    // Exit if auto-conditions are not active or no conditions exist
    if (!settings?.autoConditionsActive || !settings.conditions) {
      functions.logger.info("Auto conditions are disabled or no conditions found.");
      return null;
    }

    const now = new Date();
    // Get current time in HH:MM format, ensuring leading zeros
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const conditions = settings.conditions as Record<string, any>;
    const updates: Record<string, any> = {};
    let rateChanged = false;

    for (const [id, condition] of Object.entries(conditions)) {
      if (condition.type === "time" && condition.value === currentTime) {
        functions.logger.info(`Time condition met for ID ${id}. Changing rate to ${condition.targetRate}`);

        // Prepare to update the current rate
        updates["/settings/exchangeControl/currentRate"] = condition.targetRate;
        
        // Log the change
        const logId = db.ref("/exchangeRateLogs").push().key;
        updates[`/exchangeRateLogs/${logId}`] = {
            date: now.toISOString(),
            modifiedBy: "النظام التلقائي",
            oldRate: settings.currentRate,
            newRate: condition.targetRate,
            currencyPair: "LYD/EGP",
        };
        
        // Prepare to delete the condition that was just triggered
        updates[`/settings/exchangeControl/conditions/${id}`] = null;
        rateChanged = true;
        
        // We only process one time-based condition per minute to avoid conflicts
        break; 
      }
    }

    if (rateChanged) {
        // Apply all updates atomically
        await db.ref().update(updates);
        functions.logger.log("Successfully applied time-based rate change.");
    } else {
        functions.logger.info("No time-based conditions met at this time.");
    }
    
    return null;
  });


/**
 * A database trigger that runs when a new transaction is created.
 * It updates a daily aggregate and checks for amount-based exchange rate conditions.
 */
export const processTransactionBasedRateChanges = functions
  .region("asia-southeast1") // Match the database region
  .database.ref("/transactions/{transactionId}")
  .onCreate(async (snapshot, context) => {
    const transaction = snapshot.val();

    // Only proceed for completed Egyptian transfers
    if (transaction.type !== "egypt_transfer" || transaction.status !== "completed") {
      return null;
    }
    
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();
    
    // Exit if auto-conditions are not active or no amount-based conditions exist
    if (!settings?.autoConditionsActive || !settings.conditions) {
        functions.logger.info("Auto conditions disabled or no conditions exist.");
        return null;
    }

    const amountConditions = Object.entries(settings.conditions as Record<string, any>)
        .filter(([, cond]) => cond.type === "amount")
        .sort(([, a], [, b]) => a.value - b.value); // Sort by amount ascending

    if (amountConditions.length === 0) {
        functions.logger.info("No amount-based conditions to check.");
        return null;
    }
    
    // Get date string YYYY-MM-DD for aggregation
    const date = new Date(transaction.timestamp).toISOString().split('T')[0];
    const aggregateRef = db.ref(`/dailyAggregates/${date}`);
    
    // Use a transaction to atomically update the daily total
    const { committed, snapshot: aggregateSnap } = await aggregateRef.transaction((currentData) => {
        if (currentData === null) {
            return { totalEgpAmount: transaction.amountEGP };
        }
        return { totalEgpAmount: currentData.totalEgpAmount + transaction.amountEGP };
    });

    if (!committed) {
        functions.logger.error("Failed to commit transaction to update daily aggregate.");
        return null;
    }

    const newTotalAmount = aggregateSnap.val().totalEgpAmount;
    functions.logger.info(`New total EGP amount for ${date} is ${newTotalAmount}.`);

    let rateChanged = false;
    const updates: Record<string, any> = {};

    // Check if the new total has passed any condition's threshold
    for (const [id, condition] of amountConditions) {
        if (newTotalAmount >= condition.value) {
            functions.logger.info(`Amount condition met for ID ${id}. New total ${newTotalAmount} >= ${condition.value}. Changing rate to ${condition.targetRate}`);
            
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
            // IMPORTANT: only apply the first (lowest) threshold met and then stop.
            // If we didn't break, a large transaction could trigger multiple conditions at once.
            break;
        }
    }

    if (rateChanged) {
        await db.ref().update(updates);
        functions.logger.log("Successfully applied amount-based rate change.");
    }
    
    return null;
});
