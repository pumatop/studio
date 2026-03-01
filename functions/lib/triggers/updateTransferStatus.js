"use strict";
"use server";
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
exports.updateTransferStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
/**
 * Updates the status of a pending Egyptian transfer and moves it to the user's transactions.
 * Handles automatic balance refunds if the transaction is failed.
 */
exports.updateTransferStatus = (0, https_1.onCall)({ region: "asia-southeast1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { transferId, status, receiptUrl } = request.data;
    if (!transferId || !status) {
        throw new https_1.HttpsError("invalid-argument", "The function must be called with a transferId and status.");
    }
    const db = admin.database();
    const transferRef = db.ref(`/admin/pending_egypt_transfers/${transferId}`);
    try {
        const snapshot = await transferRef.once("value");
        const transferData = snapshot.val();
        if (!transferData) {
            throw new https_1.HttpsError("not-found", "Transfer not found.");
        }
        const userId = transferData.userId;
        // Get the amount to be handled (Total deduction includes fees)
        const deduction = Number(transferData.totalDeduction || transferData.amountEGP || 0);
        // Update User Balance atomically using transaction
        const userRef = db.ref(`/users/${userId}`);
        await userRef.transaction((user) => {
            if (user) {
                // Always decrement the pending balance as the "in-flight" status is ending
                const currentPending = Number(user.balanceEgyptianPending) || 0;
                user.balanceEgyptianPending = Math.max(0, currentPending - deduction);
                // If the transaction failed, return the money to the available EGP balance
                if (status === "failed") {
                    const currentBalance = Number(user.balanceEGP) || 0;
                    user.balanceEGP = currentBalance + deduction;
                }
                user.lastUpdate = Date.now();
            }
            return user;
        });
        // Update the status and receipt URL in the transaction record
        const updatedTransferData = Object.assign(Object.assign({}, transferData), { status, receiptUrl: receiptUrl || null });
        // Move the transaction to the user's transactions list
        const userTransactionRef = db.ref(`/users/${userId}/transactions/${transferId}`);
        await userTransactionRef.set(updatedTransferData);
        // Clean up the pending transfer record from admin queue
        await transferRef.remove();
        return { success: true };
    }
    catch (error) {
        console.error("Error updating transfer status:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        throw new https_1.HttpsError("unknown", "Error updating transfer status.", message);
    }
});
//# sourceMappingURL=updateTransferStatus.js.map