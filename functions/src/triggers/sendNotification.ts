import * as admin from "firebase-admin";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import * as OneSignal from "onesignal-node";

// Initialize the Firebase Admin SDK
const db = admin.database();

interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  type: "standard" | "popup" | "banner";
  target: "all" | string; // userId or 'all'
}

// Define a type for the OneSignal filter
interface OneSignalFilter {
  field: "tag";
  key: string;
  relation: "=";
  value: string;
}

// Define a custom interface for the OneSignal notification object
interface MyOneSignalNotification {
  contents: {
    en: string;
  };
  headings: {
    en: string;
  };
  big_picture?: string;
  included_segments?: string[];
  filters?: OneSignalFilter[];
}

export const sendNotification = onCall(
  {region: "asia-southeast1", secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"]},
  async (request) => {
    const appId = process.env.ONE_SIGNAL_APP_ID;
    const apiKey = process.env.ONE_SIGNAL_API_KEY;

    if (!appId || !apiKey) {
      throw new HttpsError("internal", "OneSignal configuration is missing.");
    }

    // OneSignal Client Initialization
    const oneSignalClient = new OneSignal.Client(appId, apiKey);

    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }

    const adminUid = request.auth.uid;
    const {
      title,
      body,
      imageUrl,
      type,
      target,
    } = request.data as NotificationPayload;

    if (!title || !body || !type || !target) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required notification fields.",
      );
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

    // OneSignal notification object
    const oneSignalNotification: MyOneSignalNotification = {
      contents: {
        en: body,
      },
      headings: {
        en: title,
      },
    };

    if (imageUrl) {
      oneSignalNotification.big_picture = imageUrl;
    }


    try {
      if (target === "all") {
        // 1. Send to all users via OneSignal using the "All" segment
        oneSignalNotification.included_segments = ["All"];
        await oneSignalClient.createNotification(oneSignalNotification);

        // 2. Log to RTDB for history
        await db.ref("/notifications").push(notificationRecord);
        logger.info(`Notification for 'all' sent by admin ${adminUid}`);
        return {
          success: true,
          message: "Notification sent to all users successfully.",
        };
      } else {
        // --- New logic for sending to a specific user via tags ---

        // 1. Get user's notification settings
        const settingsSnapshot = await db.ref(`/users/${target}/notificationSettings`).get();
        if (!settingsSnapshot.exists()) {
          throw new HttpsError("not-found", `Notification settings for user ${target} not found.`);
        }

        const settings = settingsSnapshot.val();

        // 2. Check if the user is subscribed
        if (!settings.isSubscribed) {
          logger.warn(`User ${target} is not subscribed to notifications.`);
          // Return a success message but don't send the notification
          return {
            success: true, // It's not a server failure
            message: `User ${target} is not subscribed to notifications.`,
          };
        }

        // 3. Send to specific user via OneSignal Tags
        oneSignalNotification.filters = [
          {field: "tag", key: "user_id", relation: "=", value: target},
        ];
        await oneSignalClient.createNotification(oneSignalNotification);

        // 4. Log to RTDB for history
        await db.ref(`/users/${target}/notifications`).push(notificationRecord);
        logger.info(
          `Notification for user ${target} sent by admin ${adminUid} via tags`,
        );
        return {
          success: true,
          message: "Notification for user sent successfully via tags.",
        };
      }
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error("Error sending notification:", error);
      throw new HttpsError("internal", "Failed to send notification.");
    }
  },
);
