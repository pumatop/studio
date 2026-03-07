
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
 * فحص شروط سعر الصرف القائمة على الوقت كل دقيقة.
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

    if (!settings?.autoConditionsActive || !settings.conditions) {
      return;
    }

    const now = new Date();
    const userTimezone = settings.timezone || "Africa/Cairo";
    const currentTime = now.toLocaleTimeString("en-GB", {
        timeZone: userTimezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    });

    const conditions = settings.conditions as Record<string, Condition>;
    const updates: Record<string, unknown> = {};
    let rateChanged = false;

    for (const [id, condition] of Object.entries(conditions)) {
      if (condition.type === "time" && condition.value === currentTime) {
        logger.info(`Time condition met for ID ${id}. New rate: ${condition.targetRate}`);

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
        break;
      }
    }

    if (rateChanged) {
      await db.ref().update(updates);
    }
  }
);

/**
 * فحص شروط سعر الصرف القائمة على إجمالي المبالغ عند اكتمال أي معاملة.
 */
export const processTransactionBasedRateChanges = onValueCreated(
  {
    ref: "/users/{uid}/transactions/{transactionId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const transaction = event.data.val();

    if (transaction.type !== "egypt_transfer" || transaction.status !== "completed") {
      return;
    }

    const date = new Date(transaction.timestamp).toISOString().split("T")[0];
    const aggregateRef = db.ref(`/dailyAggregates/${date}`);
    const { committed, snapshot: aggSnap } = await aggregateRef.transaction((current) => {
        if (current === null) return { totalEgpAmount: transaction.amountEGP };
        return { totalEgpAmount: (current.totalEgpAmount || 0) + transaction.amountEGP };
    });

    if (!committed) return;
    
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();

    if (!settings?.autoConditionsActive || !settings.conditions) return;

    const newTotal = aggSnap.val().totalEgpAmount;
    const amountConditions = Object.entries(settings.conditions as Record<string, Condition>)
      .filter(([, cond]) => cond.type === "amount")
      .sort(([, a], [, b]) => (a.value as number) - (b.value as number));

    const updates: Record<string, unknown> = {};
    let rateChanged = false;

    for (const [id, condition] of amountConditions) {
      if (newTotal >= (condition.value as number)) {
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

    if (rateChanged) {
      await db.ref().update(updates);
    }
  }
);

/**
 * الإغلاق التلقائي للصرف عند الوصول لسقف التداول اليومي.
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

        if (settings?.mode !== "auto" || !settings.isOpen) return;

        const aggregate = event.data.after.val();
        if (!aggregate || typeof aggregate.totalEgpAmount === "undefined") return;

        if (aggregate.totalEgpAmount >= settings.autoCloseThreshold) {
            await settingsRef.update({ isOpen: false });
        }
    }
);
