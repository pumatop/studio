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

  // Base payload without target-specific properties (token, topic, condition)
  // and without image, which will be added conditionally.
  const basePayload: admin.messaging.BaseMessage = {
    data: {
      type, // Custom data for the client app to handle UI
      "click_action": "FLUTTER_NOTIFICATION_CLICK", // Standard for Flutter
    },
    notification: {
      title,
      body,
    },
    android: {
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          "sound": "default",
          "mutable-content": 1,
        },
      },
    },
  };

  // Conditionally add image URL if it exists
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
    const userSnapshot = await db.ref(`/users/${target}`).get();
    if (!userSnapshot.exists()) {
      logger.error(`No user found for id ${target}.`);
      throw new HttpsError("not-found", `User ${target} not found.`);
    }

    const userData = userSnapshot.val();
    const tokensVal = userData.fcmTokens || userData.fcmToken;

    if (!tokensVal) {
      logger.error(`No FCM tokens found for user ${target}.`);
      throw new HttpsError("not-found", `No FCM tokens for user ${target}.`);
    }

    let tokens: string[] = [];

    if (typeof tokensVal === "string" && tokensVal) {
      tokens = [tokensVal];
    } else if (typeof tokensVal === "object" && tokensVal !== null) {
      tokens = Object.values(tokensVal).filter((t): t is string => typeof t === "string" && !!t);
    }

    if (tokens.length === 0) {
      logger.error(`Token list is empty or invalid for user ${target}.`);
      throw new HttpsError("not-found", `No valid FCM tokens for user ${target}.`);
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
      read: false, // To track if the user has read the notification
    };

    if (target !== "all") {
      // Save notification to the specific user's notification feed
      await db.ref(`/users/${target}/notifications`).push(notificationRecord);
    } else {
      // Save broadcast notifications to a general log
      await db.ref("/notifications").push(notificationRecord);
    }

    logger.info("Notification sent and recorded successfully.");
    return {success: true, message: "Notification sent successfully."};
  } catch (error) {
    logger.error("Error sending notification:", error);
    throw new HttpsError("internal", "Failed to send notification.", error);
  }
});
