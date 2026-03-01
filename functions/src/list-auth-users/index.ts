import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const listAuthUsers = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول لاستخدام هذه الخاصية.");
  }

  const callerUid = request.auth.uid;
  try {
    const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
    const callerData = callerSnap.val();

    if (!callerData || (callerData.role !== "admin" && callerData.role !== "superadmin")) {
      throw new HttpsError("permission-denied", "ليس لديك صلاحية لعرض قائمة المستخدمين.");
    }

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
  } catch (error) {
    console.error("Error listing users:", error);
    throw new HttpsError("internal", "حدث خطأ أثناء جلب المستخدمين.");
  }
});
