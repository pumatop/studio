import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * تحديث حالة الحوالة المصرية المعلقة مع منطق استرداد الرصيد في حال الرفض.
 */
export const updateTransferStatus = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
  }

  const { transferId, status, receiptUrl } = request.data;
  if (!transferId || !status) {
    throw new HttpsError("invalid-argument", "بيانات الحوالة أو الحالة ناقصة.");
  }

  const db = admin.database();
  const transferRef = db.ref(`/admin/pending_egypt_transfers/${transferId}`);

  try {
    const snapshot = await transferRef.once("value");
    const transferData = snapshot.val();

    if (!transferData) {
      throw new HttpsError("not-found", "المعاملة غير موجودة في قائمة الانتظار.");
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

    const updatedTransferData = {
      ...transferData,
      status,
      receiptUrl: receiptUrl || null,
      processedAt: admin.database.ServerValue.TIMESTAMP,
    };

    await db.ref(`/users/${userId}/transactions/${transferId}`).set(updatedTransferData);
    await transferRef.remove();

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateTransferStatus:", error);
    throw new HttpsError("internal", error.message);
  }
});