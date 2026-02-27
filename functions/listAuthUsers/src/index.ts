import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const listAuthUsers = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Unauthenticated.");
  }

  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    return {
      success: true,
      users: listUsersResult.users.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        lastSignInTime: user.metadata.lastSignInTime,
      })),
    };
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});