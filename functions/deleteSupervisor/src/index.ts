
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const deleteSupervisor = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Unauthenticated.");
  }

  const { uid } = request.data;
  if (!uid) {
    throw new HttpsError("invalid-argument", "UID required.");
  }

  try {
    await admin.auth().deleteUser(uid);
    await admin.database().ref(`/supervisors/${uid}`).remove();
    return { success: true };
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});
