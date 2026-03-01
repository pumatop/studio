import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import * as OneSignal from "onesignal-node";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

export const sendnotification = onCall(
  { region: "asia-southeast1", secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"] },
  async (request) => {
    const appId = process.env.ONE_SIGNAL_APP_ID;
    const apiKey = process.env.ONE_SIGNAL_API_KEY;

    if (!appId || !apiKey) {
      throw new HttpsError("internal", "OneSignal configuration is missing.");
    }

    const oneSignalClient = new OneSignal.Client(appId, apiKey);

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const adminUid = request.auth.uid;
    const { title, body, imageUrl, type, target } = request.data;

    if (!title || !body || !type || !target) {
      throw new HttpsError("invalid-argument", "Missing required notification fields.");
    }

    const notificationRecord = {
      title,
      body,
      imageUrl: imageUrl || null,
      type,
      target,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      sentBy: adminUid,
    };

    const oneSignalNotification: any = {
      contents: { en: body },
      headings: { en: title },
    };

    if (imageUrl) {
      oneSignalNotification.big_picture = imageUrl;
    }

    try {
      if (target === "all") {
        oneSignalNotification.included_segments = ["All"];
        await oneSignalClient.createNotification(oneSignalNotification);
        await db.ref("/notifications").push(notificationRecord);
        return { success: true, message: "Notification sent to all users successfully." };
      } else {
        const settingsSnapshot = await db.ref(`/users/${target}/notificationSettings`).get();
        if (!settingsSnapshot.exists()) {
          throw new HttpsError("not-found", `Notification settings for user ${target} not found.`);
        }
        const settings = settingsSnapshot.val();
        if (!settings.isSubscribed) {
          return { success: true, message: `User ${target} is not subscribed to notifications.` };
        }
        oneSignalNotification.filters = [{ field: "tag", key: "user_id", relation: "=", value: target }];
        await oneSignalClient.createNotification(oneSignalNotification);
        await db.ref(`/users/${target}/notifications`).push(notificationRecord);
        return { success: true, message: "Notification for user sent successfully via tags." };
      }
    } catch (error: any) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error sending notification:", error);
      throw new HttpsError("internal", "Failed to send notification.");
    }
  }
);