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
exports.notifyOnRateChange = void 0;
const database_1 = require("firebase-functions/v2/database");
const v2_1 = require("firebase-functions/v2");
const OneSignal = __importStar(require("onesignal-node"));
exports.notifyOnRateChange = (0, database_1.onValueWritten)({
    ref: "/settings/exchangeControl/currentRate",
    region: "asia-southeast1",
    secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"],
}, async (event) => {
    // Exit if the data was deleted.
    if (!event.data.after.exists()) {
        v2_1.logger.info("Rate was deleted, no notification sent.");
        return;
    }
    const oldRate = event.data.before.val();
    const newRate = event.data.after.val();
    // Exit if the rate hasn't changed.
    if (oldRate === newRate) {
        v2_1.logger.info(`Rate has not changed. Old: ${oldRate}, New: ${newRate}. No notification sent.`);
        return;
    }
    // Don't notify on initial creation
    if (!event.data.before.exists()) {
        v2_1.logger.info(`Rate was created with value: ${newRate}. No notification sent on initial creation.`);
        return;
    }
    const title = "تحديث سعر الصرف";
    const body = `تم تحديث سعر صرف الدينار الليبي مقابل الجنيه المصري. السعر الجديد: ${Number(newRate).toFixed(2)}`;
    const appId = process.env.ONE_SIGNAL_APP_ID;
    const apiKey = process.env.ONE_SIGNAL_API_KEY;
    if (!appId || !apiKey) {
        v2_1.logger.error("OneSignal configuration missing (APP_ID or API_KEY)");
        return;
    }
    const oneSignalClient = new OneSignal.Client(appId, apiKey);
    const notification = {
        contents: {
            en: body,
            ar: body,
        },
        headings: {
            en: title,
            ar: title,
        },
        included_segments: ["All"],
    };
    try {
        const response = await oneSignalClient.createNotification(notification);
        v2_1.logger.info("Notification sent successfully:", response.body);
    }
    catch (error) {
        v2_1.logger.error("Error sending notification:", error);
    }
});
//# sourceMappingURL=notifyOnRateChange.js.map