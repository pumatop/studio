"use server";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

/**
 * Updates the status of a pending Egyptian transfer and moves it to the user's transactions.
 * Handles automatic balance refunds if the transaction is failed.
 */
export const updateTransferStatus = onCall({region: "asia-southeast1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {transferId, status, receiptUrl} = request.data;

  if (!transferId || !status) {
    throw new HttpsError(
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
      throw new HttpsError("not-found", "Transfer not found.");
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
    const updatedTransferData = {
      ...transferData,
      status,
      receiptUrl: receiptUrl || null,
    };

    // Move the transaction to the user's transactions list
    const userTransactionRef = db.ref(`/users/${userId}/transactions/${transferId}`);
    await userTransactionRef.set(updatedTransferData);

    // Clean up the pending transfer record from admin queue
    await transferRef.remove();

    return {success: true};
  } catch (error: unknown) {
    console.error("Error updating transfer status:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new HttpsError(
      "unknown",
      "Error updating transfer status.",
      message
    );
  }
});
