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
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * تحديث حالة الحوالة المصرية المعلقة مع منطق استرداد الرصيد في حال الرفض.
 */
exports.updateTransferStatus = (0, https_1.onCall)({ region: "asia-southeast1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
    }
    const { transferId, status, receiptUrl } = request.data;
    if (!transferId || !status) {
        throw new https_1.HttpsError("invalid-argument", "بيانات الحوالة أو الحالة ناقصة.");
    }
    const db = admin.database();
    const transferRef = db.ref(`/admin/pending_egypt_transfers/${transferId}`);
    try {
        const snapshot = await transferRef.once("value");
        const transferData = snapshot.val();
        if (!transferData) {
            throw new https_1.HttpsError("not-found", "المعاملة غير موجودة في قائمة الانتظار.");
        }
        const userId = transferData.userId;
        const deduction = Number(transferData.totalDeduction || transferData.amountEGP || 0);
        const userRef = db.ref(`/users/${userId}`);
        await userRef.transaction((user) => {
            if (user) {
                const currentPending = Number(user.balanceEgyptianPending) || 0;
                user.balanceEgyptianPending = Math.max(0, currentPending - deduction);
                if (status === "failed") {
                    const currentBalance = Number(user.balanceEGP) || 0;
                    user.balanceEGP = currentBalance + deduction;
                }
                user.lastUpdate = Date.now();
            }
            return user;
        });
        const updatedTransferData = Object.assign(Object.assign({}, transferData), { status, receiptUrl: receiptUrl || null, processedAt: admin.database.ServerValue.TIMESTAMP });
        await db.ref(`/users/${userId}/transactions/${transferId}`).set(updatedTransferData);
        await transferRef.remove();
        return { success: true };
    }
    catch (error) {
        console.error("Error in updateTransferStatus:", error);
        throw new https_1.HttpsError("internal", error.message);
    }
});
//# sourceMappingURL=updateTransferStatus.js.map