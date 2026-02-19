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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAutoExchangeStatus = void 0;
const admin = __importStar(require("firebase-admin"));
const database_1 = require("firebase-functions/v2/database");
const v2_1 = require("firebase-functions/v2");
const db = admin.database();
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
//# sourceMappingURL=handleAutoExchangeStatus.js.map