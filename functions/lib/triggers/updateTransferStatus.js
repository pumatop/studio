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
exports.updateTransferStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.updateTransferStatus = functions.region("asia-southeast1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { transferId, status, receiptUrl } = data;
    if (!transferId || !status) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a transferId and status.");
    }
    const db = admin.database();
    const transferRef = db.ref(`/admin/pending_egypt_transfers/${transferId}`);
    try {
        const snapshot = await transferRef.once("value");
        const transferData = snapshot.val();
        if (!transferData) {
            throw new functions.https.HttpsError("not-found", "Transfer not found.");
        }
        // Update the status and receipt URL
        const updatedTransferData = Object.assign(Object.assign({}, transferData), { status, receiptUrl });
        // Move the transaction to the user's egy_transactions
        const userTransactionRef = db.ref(`/users/${transferData.userId}/egy_transactions/${transferId}`);
        await userTransactionRef.set(updatedTransferData);
        // Remove from pending transfers
        await transferRef.remove();
        return { success: true };
    }
    catch (error) {
        console.error("Error updating transfer status:", error);
        throw new functions.https.HttpsError("unknown", "Error updating transfer status.", error instanceof Error ? error.message : "Unknown error");
    }
});
//# sourceMappingURL=updateTransferStatus.js.map