import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * وظيفة لجلب قائمة المستخدمين من نظام المصادقة (Auth).
 * لا يمكن الوصول إليها إلا من قبل المسؤولين.
 */
export const listAuthUsers = functions.region("asia-southeast1").https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "يجب تسجيل الدخول لاستخدام هذه الخاصية."
    );
  }

  const callerUid = context.auth.uid;
  try {
    const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
    const callerData = callerSnap.val();

    if (!callerData || (callerData.role !== "admin" && callerData.role !== "superadmin")) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "ليس لديك صلاحية لعرض قائمة المستخدمين."
      );
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
    throw new functions.https.HttpsError("internal", "حدث خطأ أثناء جلب المستخدمين.");
  }
});
