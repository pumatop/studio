"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAutoExchangeStatus = exports.processTransactionBasedRateChanges = exports.processScheduledRateChanges = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const database_1 = require("firebase-functions/v2/database");
const v2_1 = require("firebase-functions/v2");
admin.initializeApp();
const db = admin.database();
/**
 * Checks for time-based exchange rate conditions every minute.
 * This function runs if 'autoConditionsActive' is true, regardless of exchange status.
 */
exports.processScheduledRateChanges = (0, scheduler_1.onSchedule)({
    schedule: "every 1 minutes",
    region: "asia-southeast1",
}, async () => {
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();
    // This function only runs if automatic conditions are enabled.
    if (!(settings === null || settings === void 0 ? void 0 : settings.autoConditionsActive) || !settings.conditions) {
        v2_1.logger.info("Automatic rate conditions are disabled or no conditions found.");
        return;
    }
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    const conditions = settings.conditions;
    const updates = {};
    let rateChanged = false;
    for (const [id, condition] of Object.entries(conditions)) {
        if (condition.type === "time" && condition.value === currentTime) {
            v2_1.logger.info(`Time condition met for ID ${id}. Changing rate to ${condition.targetRate}`);
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
        v2_1.logger.log("Successfully applied time-based rate change.");
    }
    else {
        v2_1.logger.info("No time-based conditions met at this time.");
    }
    return;
});
/**
 * Checks for amount-based exchange rate conditions on new transactions.
 * This function runs if 'autoConditionsActive' is true, regardless of exchange status.
 */
exports.processTransactionBasedRateChanges = (0, database_1.onValueCreated)({
    ref: "/transactions/{transactionId}",
    region: "asia-southeast1",
}, async (event) => {
    const transaction = event.data.val();
    if (transaction.type !== "egypt_transfer" ||
        transaction.status !== "completed") {
        return;
    }
    // Update the daily aggregate first. This will trigger the auto-close function if needed.
    const date = new Date(transaction.timestamp).toISOString().split("T")[0];
    const aggregateRef = db.ref(`/dailyAggregates/${date}`);
    const { committed, snapshot: aggSnap } = await aggregateRef.transaction((currentData) => {
        if (currentData === null) {
            return { totalEgpAmount: transaction.amountEGP };
        }
        return {
            totalEgpAmount: currentData.totalEgpAmount + transaction.amountEGP,
        };
    });
    if (!committed) {
        v2_1.logger.error("Failed to commit transaction to update daily aggregate.");
        return;
    }
    // Now, check for rate change conditions
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();
    if (!(settings === null || settings === void 0 ? void 0 : settings.autoConditionsActive) || !settings.conditions) {
        v2_1.logger.info("Automatic rate conditions disabled or no conditions exist.");
        return;
    }
    const amountConditions = Object.entries(settings.conditions)
        .filter(([, cond]) => cond.type === "amount")
        .sort(([, a], [, b]) => a.value - b.value);
    if (amountConditions.length === 0) {
        v2_1.logger.info("No amount-based rate conditions to check.");
        return;
    }
    const newTotalAmount = aggSnap.val().totalEgpAmount;
    v2_1.logger.info(`New total EGP amount for ${date} is ${newTotalAmount}. Checking for rate changes.`);
    let rateChanged = false;
    const updates = {};
    for (const [id, condition] of amountConditions) {
        if (newTotalAmount >= condition.value) {
            v2_1.logger.info(`Amount-based rate condition met for ID ${id}. ` +
                `New total ${newTotalAmount} >= ${condition.value}. ` +
                `Changing rate to ${condition.targetRate}`);
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
        v2_1.logger.log("Successfully applied amount-based rate change.");
    }
    return;
});
/**
 * Automatically closes the exchange based on daily trading volume.
 * This function only runs if the exchange mode is 'auto'.
 */
exports.handleAutoExchangeStatus = (0, database_1.onValueWritten)({
    ref: "/dailyAggregates/{date}",
    region: "asia-southeast1",
}, async (event) => {
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();
    // Only run if mode is 'auto' and exchange is currently open.
    if ((settings === null || settings === void 0 ? void 0 : settings.mode) !== "auto" || !settings.isOpen) {
        v2_1.logger.info("Auto-close is disabled (mode is not 'auto' or exchange is already closed).");
        return;
    }
    // Get the total amount for the day from the trigger event's 'after' state.
    const aggregate = event.data.after.val();
    if (!aggregate || typeof aggregate.totalEgpAmount === "undefined") {
        v2_1.logger.info("No aggregate data found to process for auto-close check.");
        return;
    }
    const newTotalAmount = aggregate.totalEgpAmount;
    // Check if the threshold is met.
    if (newTotalAmount >= settings.autoCloseThreshold) {
        v2_1.logger.info(`Auto-close threshold met. Total: ${newTotalAmount}, Threshold: ${settings.autoCloseThreshold}. Closing exchange.`);
        // Close the exchange by setting isOpen to false.
        await settingsRef.update({ isOpen: false });
    }
    return;
});
//# sourceMappingURL=index.js.map
