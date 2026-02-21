"use client";
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

  let sendPromise;

  if (target === "all") {
    const topicMessage: admin.messaging.TopicMessage = {
      topic: "all_users",
      data: {
        type,
        "click_action": "FLUTTER_NOTIFICATION_CLICK",
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
            sound: "default",
          },
        },
      },
    };

    if (imageUrl) {
      if (topicMessage.notification) {
        topicMessage.notification.imageUrl = imageUrl;
      }
      if (topicMessage.android?.notification) {
        topicMessage.android.notification.imageUrl = imageUrl;
      }
      if (topicMessage.apns) {
        if (!topicMessage.apns.payload.aps) {
          topicMessage.apns.payload.aps = {};
        }
        topicMessage.apns.payload.aps["mutable-content"] = 1;
        topicMessage.apns.fcmOptions = { imageUrl };
      }
    }

    logger.info(`Sending topic notification to "all_users" by admin ${adminUid}`);
    sendPromise = messaging.send(topicMessage);
  } else {
    const userSnapshot = await db.ref(`/users/${target}`).get();
    if (!userSnapshot.exists()) {
      throw new HttpsError("not-found", `User ${target} not found.`);
    }
    const userData = userSnapshot.val();
    let tokens: string[] = [];

    if (userData.fcmToken && typeof userData.fcmToken === "string" && userData.fcmToken) {
      tokens.push(userData.fcmToken);
    }
    if (userData.fcmTokens && typeof userData.fcmTokens === "object") {
      tokens.push(...Object.values(userData.fcmTokens).filter((t): t is string => typeof t === "string" && !!t));
    }
    tokens = [...new Set(tokens)]; // Deduplicate

    if (tokens.length === 0) {
      logger.error(`No valid FCM tokens for user ${target}.`);
      throw new HttpsError("not-found", `No FCM tokens for user ${target}.`);
    }

    const multicastMessage: admin.messaging.MulticastMessage = {
      tokens,
      data: {
        type,
        "click_action": "FLUTTER_NOTIFICATION_CLICK",
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
            sound: "default",
          },
        },
      },
    };

    if (imageUrl) {
      if (multicastMessage.notification) {
        multicastMessage.notification.imageUrl = imageUrl;
      }
      if (multicastMessage.android?.notification) {
        multicastMessage.android.notification.imageUrl = imageUrl;
      }
      if (multicastMessage.apns) {
        if (!multicastMessage.apns.payload.aps) {
          multicastMessage.apns.payload.aps = {};
        }
        multicastMessage.apns.payload.aps["mutable-content"] = 1;
        multicastMessage.apns.fcmOptions = { imageUrl };
      }
    }

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

    if (target !== "all") {
      await db.ref(`/users/${target}/notifications`).push(notificationRecord);
    } else {
      await db.ref("/notifications").push(notificationRecord);
    }

    logger.info("Notification sent and recorded successfully.");
    return {success: true, message: "Notification sent successfully."};
  } catch (error) {
    logger.error("Error sending notification:", error);
    throw new HttpsError("internal", "Failed to send notification.", error);
  }
});
