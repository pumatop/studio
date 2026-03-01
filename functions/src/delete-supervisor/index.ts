import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const deletesupervisor = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called by an authenticated user.");
  }

  const callerUid = request.auth.uid;
  let isAdmin = false;
  try {
    const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
    isAdmin = callerSnap.val()?.role === "admin";
  } catch (e: any) {
    throw new HttpsError("internal", "Could not verify admin status.");
  }

  if (!isAdmin) {
    throw new HttpsError("permission-denied", "Only admins can delete supervisors.");
  }

  const uidToDelete = request.data.uid;
  if (!uidToDelete || typeof uidToDelete !== "string") {
    throw new HttpsError("invalid-argument", "The function must be called with a valid \"uid\" string.");
  }

  try {
    await admin.auth().deleteUser(uidToDelete);
    const dbRef = admin.database().ref(`/supervisors/${uidToDelete}`);
    await dbRef.remove();
    return { success: true, message: `Supervisor ${uidToDelete} has been completely deleted.` };
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      const dbRef = admin.database().ref(`/supervisors/${uidToDelete}`);
      await dbRef.remove();
      return { success: true, message: "User was already deleted from Authentication. Database cleanup successful." };
    }
    throw new HttpsError("internal", error.message);
  }
});