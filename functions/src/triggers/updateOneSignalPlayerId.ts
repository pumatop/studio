
import * as admin from "firebase-admin";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";

const db = admin.database();

export const updateOneSignalPlayerId = onCall({region: "asia-southeast1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const uid = request.auth.uid;
  const {playerId} = request.data;

  if (!playerId || typeof playerId !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "The 'playerId' parameter must be a non-empty string."
    );
  }

  try {
    await db.ref(`/users/${uid}`).update({oneSignalPlayerId: playerId});
    logger.info(`Updated OneSignal Player ID for user ${uid}`);
    return {success: true, message: "OneSignal Player ID updated successfully."};
  } catch (error) {
    logger.error(`Error updating OneSignal Player ID for user ${uid}:`, error);
    throw new HttpsError("internal", "Could not update OneSignal Player ID.");
  }
});
