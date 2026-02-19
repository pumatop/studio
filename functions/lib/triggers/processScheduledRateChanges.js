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
exports.processScheduledRateChanges = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const db = admin.database();
/**
 * Checks for time-based exchange rate conditions every minute.
 * This function runs if 'autoConditionsActive' is true.
 */
exports.processScheduledRateChanges = (0, scheduler_1.onSchedule)({
    schedule: "every 1 minutes",
    region: "asia-southeast1",
    timeZone: "Africa/Cairo",
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
        v2_1.logger.log("Successfully applied time-based rate change.");
    }
    else {
        v2_1.logger.info("No time-based conditions met at this time.");
    }
    return;
});
//# sourceMappingURL=processScheduledRateChanges.js.map
