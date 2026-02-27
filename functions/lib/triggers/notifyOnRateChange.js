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
const admin = __importStar(require("firebase-admin"));
const OneSignal = __importStar(require("onesignal-node"));
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.notifyOnRateChange = (0, database_1.onValueWritten)({
    ref: "/settings/exchangeControl/currentRate",
    region: "asia-southeast1",
    secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"],
}, async (event) => {
    if (!event.data.after.exists())
        return;
    const oldRate = event.data.before.val();
    const newRate = event.data.after.val();
    if (oldRate === newRate || !event.data.before.exists())
        return;
    const appId = process.env.ONE_SIGNAL_APP_ID;
    const apiKey = process.env.ONE_SIGNAL_API_KEY;
    const client = new OneSignal.Client(appId, apiKey);
    const title = "تحديث سعر الصرف";
    const body = `تم تحديث سعر صرف الدينار الليبي مقابل الجنيه المصري. السعر الجديد: ${Number(newRate).toFixed(2)}`;
    try {
        await client.createNotification({
            contents: { en: body, ar: body },
            headings: { en: title, ar: title },
            included_segments: ["All"],
        });
    }
    catch (e) {
        console.error("Error sending rate notification:", e);
    }
});
//# sourceMappingURL=notifyOnRateChange.js.map