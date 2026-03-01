import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

export const updateTransferStatus = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
  const { transferId, status, receiptUrl } = request.data;
  if (!transferId || !status) throw new HttpsError("invalid-argument", "Missing params.");

  const transferRef = db.ref(`/admin/pending_egypt_transfers/${transferId}`);
  const snap = await transferRef.get();
  const transfer = snap.val();
  if (!transfer) throw new HttpsError("not-found", "Not found.");

  const deduction = Number(transfer.totalDeduction || 0);
  const userRef = db.ref(`/users/${transfer.userId}`);

  await userRef.transaction((user) => {
    if (user) {
      user.balanceEgyptianPending = Math.max(0, (user.balanceEgyptianPending || 0) - deduction);
      if (status === "failed") user.balanceEGP = (user.balanceEGP || 0) + deduction;
      user.lastUpdate = Date.now();
    }
    return user;
  });

  const update = { ...transfer, status, receiptUrl: receiptUrl || null };
  await db.ref(`/users/${transfer.userId}/transactions/${transferId}`).set(update);
  await transferRef.remove();

  return { success: true };
});
