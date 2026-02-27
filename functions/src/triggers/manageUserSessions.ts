import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const manageUserSessions = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Unauthenticated.");
  }

  const { userId, sessionId, action } = request.data;
  if (!userId) throw new HttpsError("invalid-argument", "userId required.");

  const db = admin.database();
  try {
    if (action === "deleteAll") {
      await db.ref(`/users/${userId}/sessions`).remove();
    } else if (sessionId) {
      await db.ref(`/users/${userId}/sessions/${sessionId}`).remove();
    }
    return { success: true };
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});