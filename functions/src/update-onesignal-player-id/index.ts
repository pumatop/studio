import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const updateonesignalplayerid = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
  const { playerId } = request.data;
  if (!playerId) throw new HttpsError("invalid-argument", "Missing playerId.");

  try {
    await admin.database().ref(`/users/${request.auth.uid}`).update({ oneSignalPlayerId: playerId });
    return { success: true };
  } catch (error) {
    throw new HttpsError("internal", "Update failed.");
  }
});
