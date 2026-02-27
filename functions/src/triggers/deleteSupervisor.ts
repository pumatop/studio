
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const deleteSupervisor = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check: Ensure the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called by an authenticated user.",
    );
  }

  // 2. Admin Check: Verify the calling user is an admin.
  const callerUid = context.auth.uid;
  let isAdmin = false;
  try {
    const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
    isAdmin = callerSnap.val()?.role === "admin";
  } catch (e: any) {
    functions.logger.error("Error checking admin status:", e);
    throw new functions.https.HttpsError("internal", "Could not verify admin status.");
  }

  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can delete supervisors.",
    );
  }

  // 3. UID Validation: Check if the UID to delete is provided.
  const uidToDelete = data.uid;
  if (!uidToDelete || typeof uidToDelete !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid \"uid\" string.",
    );
  }

  try {
    // 4. Delete from Auth
    await admin.auth().deleteUser(uidToDelete);
    functions.logger.info(`Successfully deleted user ${uidToDelete} from Authentication.`);

    // 5. Delete from Realtime Database
    const dbRef = admin.database().ref(`/supervisors/${uidToDelete}`);
    await dbRef.remove();
    functions.logger.info(`Successfully deleted supervisor data for ${uidToDelete} from Realtime Database.`);

    return {success: true, message: `Supervisor ${uidToDelete} has been completely deleted.`};
  } catch (error: any) {
    functions.logger.error(`Error deleting supervisor ${uidToDelete}:`, error);

    // If the user is already deleted from Auth, we can still try to clean up the database.
    if (error.code === "auth/user-not-found") {
      const dbRef = admin.database().ref(`/supervisors/${uidToDelete}`);
      await dbRef.remove();
      functions.logger.warn(`User ${uidToDelete} was not found in Auth, but their data was cleaned up from the database.`);
      return {success: true, message: "User was already deleted from Authentication. Database cleanup successful."};
    }

    throw new functions.https.HttpsError("internal", error.message, error.details);
  }
});
