
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.database();

/**
 * دالة تحديث حالة الحوالة المصرية المعلقة مع منطق استرداد الرصيد التلقائي.
 */
export const updateTransferStatus = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
  }

  const { transferId, status, receiptUrl } = request.data;

  if (!transferId || !status) {
    throw new HttpsError("invalid-argument", "بيانات الطلب ناقصة.");
  }

  const transferRef = db.ref(`/admin/pending_egypt_transfers/${transferId}`);
  const snapshot = await transferRef.get();
  const transferData = snapshot.val();

  if (!transferData) {
    throw new HttpsError("not-found", "العملية غير موجودة.");
  }

  const userId = transferData.userId;
  const deduction = Number(transferData.totalDeduction || transferData.amountEGP || 0);

  // تحديث رصيد المستخدم بشكل آمن (Atomic Transaction)
  const userRef = db.ref(`/users/${userId}`);
  await userRef.transaction((user) => {
    if (user) {
      // خصم المبلغ من الرصيد المعلق دائماً عند المعالجة
      const currentPending = Number(user.balanceEgyptianPending) || 0;
      user.balanceEgyptianPending = Math.max(0, currentPending - deduction);

      // في حال الرفض، يتم إعادة المبلغ بالكامل للرصيد المتاح
      if (status === "failed") {
        const currentBalance = Number(user.balanceEGP) || 0;
        user.balanceEGP = currentBalance + deduction;
      }
      user.lastUpdate = Date.now();
    }
    return user;
  });

  // تحديث بيانات العملية النهائية ونقلها لجدول المستخدم
  const finalTransactionData = {
    ...transferData,
    status,
    receiptUrl: receiptUrl || null,
    processedAt: Date.now(),
    processedBy: request.auth.uid
  };

  await db.ref(`/users/${userId}/transactions/${transferId}`).set(finalTransactionData);
  await transferRef.remove();

  return { success: true };
});
