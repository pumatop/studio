import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

export const manageUserSessions = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const adminUid = request.auth.uid;
  const adminUserRef = db.ref(`/users/${adminUid}`);
  const adminUserSnapshot = await adminUserRef.get();
  const adminUserData = adminUserSnapshot.val();

  if (!adminUserData) {
    throw new HttpsError("permission-denied", `Permission denied. User profile not found.`);
  }

  if (adminUserData.role !== "admin" && adminUserData.role !== "superadmin") {
    throw new HttpsError("permission-denied", "User does not have admin role.");
  }

  const { userId, sessionId, action } = request.data;

  if (!userId) {
    throw new HttpsError("invalid-argument", "The 'userId' parameter is required.");
  }

  if (action === "deleteAll") {
    const sessionsRef = db.ref(`/users/${userId}/sessions`);
    try {
      await sessionsRef.remove();
      return { success: true, message: `All sessions deleted.` };
    } catch (error) {
      throw new HttpsError("internal", "Could not delete all user sessions.");
    }
  } else if (sessionId) {
    const sessionRef = db.ref(`/users/${userId}/sessions/${sessionId}`);
    try {
      await sessionRef.remove();
      return { success: true, message: `Session deleted.` };
    } catch (error) {
      throw new HttpsError("internal", `Could not delete session.`);
    }
  } else {
    throw new HttpsError("invalid-argument", "Missing sessionId or action=deleteAll.");
  }
});
