import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const updateOneSignalPlayerId = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Unauthenticated.");

  const uid = request.auth.uid;
  const { playerId } = request.data;

  if (!playerId) throw new HttpsError("invalid-argument", "playerId required.");

  try {
    await admin.database().ref(`/users/${uid}`).update({ oneSignalPlayerId: playerId });
    return { success: true };
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});