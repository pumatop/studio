import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {logger} from "firebase-functions/v2";

const db = admin.database();

interface Condition {
  type: "time" | "amount";
  value: string | number;
  targetRate: number;
}

/**
 * Checks for time-based exchange rate conditions every minute.
 * This function runs if 'autoConditionsActive' is true.
 */
export const processScheduledRateChanges = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "asia-southeast1",
    timeZone: "UTC", // Run every minute based on UTC, but logic inside will use user's timezone
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
    
    const userTimezone = settings.timezone || "UTC"; // Fallback to UTC

    const now = new Date();
    // Get the current time in the user-defined timezone, formatted as HH:mm
    const currentTime = now.toLocaleTimeString("en-GB", {
        timeZone: userTimezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23", // Use h23 for 00-23 hour format
    });
    
    logger.info(`Checking for time conditions in timezone ${userTimezone}. Current Time: ${currentTime}`, { conditions: settings.conditions });

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
          date: new Date().toISOString(),
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
