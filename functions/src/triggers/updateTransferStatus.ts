import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const updateTransferStatus = functions.region("asia-southeast1").https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {transferId, status, receiptUrl} = data;

  if (!transferId || !status) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a transferId and status."
    );
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
    const updatedTransferData = {...transferData, status, receiptUrl};

    // Move the transaction to the user's egy_transactions
    const userTransactionRef = db.ref(`/users/${transferData.userId}/egy_transactions/${transferId}`);
    await userTransactionRef.set(updatedTransferData);

    // Remove from pending transfers
    await transferRef.remove();

    return {success: true};
  } catch (error: unknown) {
    console.error("Error updating transfer status:", error);
    throw new functions.https.HttpsError(
      "unknown",
      "Error updating transfer status.",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});
