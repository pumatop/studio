'use client';
import * as admin from "firebase-admin";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";

const db = admin.database();
const messaging = admin.messaging();

interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  type: "standard" | "popup" | "banner";
  target: "all" | string; // userId or 'all'
}

export const sendNotification = onCall({region: "asia-southeast1", secrets: []}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const adminUid = request.auth.uid;
  const {title, body, imageUrl, type, target} = request.data as NotificationPayload;

  if (!title || !body || !type || !target) {
    throw new HttpsError("invalid-argument", "Missing required notification fields.");
  }

  // Base payload structure. We will conditionally add image-related fields.
  const basePayload: Omit<admin.messaging.Message, "topic" | "token" | "condition"> & {
    apns?: admin.messaging.APNSConfig
    android?: admin.messaging.AndroidConfig
  } = {
    notification: {
      title,
      body,
    },
    data: {
      type,
      "click_action": "FLUTTER_NOTIFICATION_CLICK",
    },
    android: {
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          "mutable-content": 1,
        },
      },
    },
  };

  // Conditionally add imageUrl to the payload if it exists.
  // This prevents sending `imageUrl: undefined` which can cause internal errors.
  if (imageUrl) {
    if (basePayload.notification) {
      basePayload.notification.imageUrl = imageUrl;
    }
    if (basePayload.android?.notification) {
      basePayload.android.notification.imageUrl = imageUrl;
    }
    if (basePayload.apns) {
      basePayload.apns.fcmOptions = {imageUrl};
    }
  }


  let sendPromise;

  if (target === "all") {
    const topicMessage: admin.messaging.TopicMessage = {
      ...basePayload,
      topic: "all_users",
    };
    logger.info(`Sending topic notification to "all_users" by admin ${adminUid}`);
    sendPromise = messaging.send(topicMessage);
  } else {
    // Fetch the user's FCM token(s) from the database
    const tokensSnapshot = await db.ref(`/users/${target}/fcmTokens`).get();
    if (!tokensSnapshot.exists()) {
      logger.error(`No FCM tokens found for user ${target}.`);
      throw new HttpsError("not-found", `No FCM tokens for user ${target}.`);
    }
    const tokens = Object.values(tokensSnapshot.val()) as string[];
    if (tokens.length === 0) {
      logger.error(`Token list is empty for user ${target}.`);
      throw new HttpsError("not-found", `Token list is empty for user ${target}.`);
    }

    const multicastMessage: admin.messaging.MulticastMessage = {
      ...basePayload,
      tokens,
    };

    logger.info(`Sending multicast notification to user ${target} (${tokens.length} tokens) by admin ${adminUid}`);
    sendPromise = messaging.sendEachForMulticast(multicastMessage);
  }

  try {
    await sendPromise;

    const notificationRecord = {
      title,
      body,
      imageUrl: imageUrl || null,
      type,
      target,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      sentBy: adminUid,
    };

    await db.ref("/notifications").push(notificationRecord);

    logger.info("Notification sent and recorded successfully.");
    return {success: true, message: "Notification sent successfully."};
  } catch (error) {
    logger.error("Error sending notification:", error);
    throw new HttpsError("internal", "Failed to send notification.", error);
  }
});
