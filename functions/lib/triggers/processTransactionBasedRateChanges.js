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
exports.processTransactionBasedRateChanges = void 0;
const database_1 = require("firebase-functions/v2/database");
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.processTransactionBasedRateChanges = (0, database_1.onValueCreated)({
    ref: "/users/{userId}/transactions/{transactionId}",
    region: "asia-southeast1",
}, async (event) => {
    const transaction = event.data.val();
    if (transaction.type !== "egypt_transfer" || transaction.status !== "completed")
        return;
    const db = admin.database();
    const date = new Date(transaction.timestamp).toISOString().split("T")[0];
    const aggregateRef = db.ref(`/dailyAggregates/${date}`);
    const { snapshot: aggSnap } = await aggregateRef.transaction((current) => {
        if (current === null)
            return { totalEgpAmount: transaction.amountEGP };
        return { totalEgpAmount: current.totalEgpAmount + transaction.amountEGP };
    });
    const settingsSnap = await db.ref("/settings/exchangeControl").get();
    const settings = settingsSnap.val();
    if (!(settings === null || settings === void 0 ? void 0 : settings.autoConditionsActive) || !settings.conditions)
        return;
    const newTotal = aggSnap.val().totalEgpAmount;
    const amountConditions = Object.entries(settings.conditions)
        .filter(([, c]) => c.type === "amount")
        .sort(([, a], [, b]) => a.value - b.value);
    for (const [id, cond] of amountConditions) {
        if (newTotal >= cond.value) {
            const updates = {};
            updates["/settings/exchangeControl/currentRate"] = cond.targetRate;
            updates[`/exchangeRateLogs/${db.ref("/exchangeRateLogs").push().key}`] = {
                date: new Date().toISOString(),
                modifiedBy: "النظام التلقائي",
                oldRate: settings.currentRate,
                newRate: cond.targetRate,
                currencyPair: "LYD/EGP",
            };
            updates[`/settings/exchangeControl/conditions/${id}`] = null;
            await db.ref().update(updates);
            break;
        }
    }
});
//# sourceMappingURL=processTransactionBasedRateChanges.js.map