
"use server";
import * as admin from "firebase-admin";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onValueCreated, onValueWritten} from "firebase-functions/v2/database";
import {logger} from "firebase-functions/v2";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.database();

interface Condition {
  type: "time" | "amount";
  value: string | number;
  targetRate: number;
}

/**
 * محرك الشروط الزمنية: يعمل كل دقيقة لمطابقة وقت السيرفر بشروط المسؤول.
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
        logger.info(`Time condition triggered: ${id}. Setting rate to ${condition.targetRate}`);

        updates["/settings/exchangeControl/currentRate"] = condition.targetRate;

        const logId = db.ref("/exchangeRateLogs").push().key;
        updates[`/exchangeRateLogs/${logId}`] = {
          date: now.toISOString(),
          modifiedBy: "النظام التلقائي (شرط وقت)",
          oldRate: settings.currentRate,
          newRate: condition.targetRate,
          currencyPair: "LYD/EGP",
        };
        updates[`/settings/exchangeControl/conditions/${id}`] = null;
        rateChanged = true;
        break; // نفذ أول شرط مطابق فقط في الدقيقة الواحدة
      }
    }

    if (rateChanged) {
      await db.ref().update(updates);
    }
  }
);

/**
 * محرك شروط المبالغ: يعمل عند كل تغيير في حالة المعاملة.
 * يتم الاحتساب فقط عندما تتحول الحالة إلى 'completed'.
 */
export const processTransactionBasedRateChanges = onValueWritten(
  {
    ref: "/users/{uid}/transactions/{transactionId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const before = event.data.before.val();
    const after = event.data.after.val();

    if (!after || !["egypt_transfer", "egypt_home", "egypt_wallets", "egypt_instapay"].includes(after.type)) {
      return;
    }

    const wasCompleted = before?.status === "completed";
    const isCompleted = after.status === "completed";

    // إذا لم تتغير حالة الاكتمال، فلا حاجة لتحديث الإحصائيات
    if (wasCompleted === isCompleted) return;

    const amount = Number(after.amountEGP || 0);
    const diff = isCompleted ? amount : -amount; // إضافة إذا اكتملت، خصم إذا تراجعت

    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();
    const userTimezone = settings?.timezone || "Africa/Cairo";

    // تحديد التاريخ بناءً على المنطقة الزمنية المحددة
    const date = new Intl.DateTimeFormat('en-CA', { 
        timeZone: userTimezone, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).format(new Date(after.timestamp));

    const aggregateRef = db.ref(`/dailyAggregates/${date}`);
    
    const { snapshot: aggSnap } = await aggregateRef.transaction((current) => {
        if (current === null) return { totalEgpAmount: Math.max(0, diff) };
        return { totalEgpAmount: Math.max(0, (current.totalEgpAmount || 0) + diff) };
    });

    if (isCompleted && settings?.autoConditionsActive && settings.conditions) {
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
              modifiedBy: "النظام التلقائي (شرط مبلغ)",
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
  }
);

/**
 * نظام الإغلاق التلقائي: يغلق الصرف فوراً عند تجاوز سقف التداول اليومي.
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
            logger.info("Daily threshold reached. Closing exchange automatically.");
            await settingsRef.update({ isOpen: false });
        }
    }
);
