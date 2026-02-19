import * as admin from "firebase-admin";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";

const db = admin.database();

export const manageUserSessions = onCall({region: "asia-southeast1"}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const adminUid = request.auth.uid;
  const adminUserRef = db.ref(`/users/${adminUid}`);
  const adminUserSnapshot = await adminUserRef.get();
  const adminUserData = adminUserSnapshot.val();

  if (!adminUserData || adminUserData.role !== "admin") {
    throw new HttpsError("permission-denied", "Only administrators can manage user sessions.");
  }

  const {userId, sessionId, action} = request.data;

  if (!userId || typeof userId !== "string") {
    throw new HttpsError("invalid-argument", "The 'userId' parameter must be a non-empty string.");
  }

  if (action === "deleteAll") {
    logger.info(`Admin ${adminUid} is deleting all sessions for user ${userId}.`);
    const sessionsRef = db.ref(`/users/${userId}/sessions`);
    try {
      await sessionsRef.remove();
      return {success: true, message: `All sessions for user ${userId} have been deleted.`};
    } catch (error) {
      logger.error(`Error deleting all sessions for user ${userId}:`, error);
      throw new HttpsError("internal", "Could not delete all user sessions.");
    }
  } else if (sessionId && typeof sessionId === "string") {
    logger.info(`Admin ${adminUid} is deleting session '${sessionId}' for user ${userId}.`);
    const sessionRef = db.ref(`/users/${userId}/sessions/${sessionId}`);
    try {
      await sessionRef.remove();
      return {success: true, message: `Session '${sessionId}' for user ${userId} has been deleted.`};
    } catch (error) {
      logger.error(`Error deleting session '${sessionId}' for user ${userId}:`, error);
      throw new HttpsError("internal", `Could not delete session '${sessionId}'.`);
    }
  } else {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'sessionId' or with the 'action' set to 'deleteAll'."
    );
  }
});
