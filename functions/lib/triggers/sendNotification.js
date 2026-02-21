"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const db = admin.database();
const messaging = admin.messaging();
exports.sendNotification = (0, https_1.onCall)({ region: "asia-southeast1", secrets: [] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const adminUid = request.auth.uid;
    const { title, body, imageUrl, type, target } = request.data;
    if (!title || !body || !type || !target) {
        throw new https_1.HttpsError("invalid-argument", "Missing required notification fields.");
    }
    const basePayload = {
        notification: {
            title,
            body,
            imageUrl,
        },
        data: {
            type,
            "click_action": "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
            notification: {
                sound: "default",
                imageUrl,
            },
        },
        apns: {
            payload: {
                aps: {
                    "sound": "default",
                    "mutable-content": 1,
                },
            },
            fcmOptions: {
                imageUrl,
            },
        },
    };
    let sendPromise;
    if (target === "all") {
        const topicMessage = Object.assign(Object.assign({}, basePayload), { topic: "all_users" });
        v2_1.logger.info(`Sending topic notification to "all_users" by admin ${adminUid}`);
        sendPromise = messaging.send(topicMessage);
    }
    else {
        const userSnapshot = await db.ref(`/users/${target}`).get();
        if (!userSnapshot.exists()) {
            throw new https_1.HttpsError("not-found", `User ${target} not found.`);
        }
        const userData = userSnapshot.val();
        let tokens = [];
        if (userData.fcmToken && typeof userData.fcmToken === "string") {
            tokens.push(userData.fcmToken);
        }
        if (userData.fcmTokens && typeof userData.fcmTokens === "object") {
            tokens.push(...Object.values(userData.fcmTokens).filter((t) => typeof t === "string" && !!t));
        }
        tokens = [...new Set(tokens)]; // Deduplicate
        if (tokens.length === 0) {
            v2_1.logger.error(`No valid FCM tokens for user ${target}.`);
            throw new https_1.HttpsError("not-found", `No FCM tokens for user ${target}.`);
        }
        const multicastMessage = Object.assign(Object.assign({}, basePayload), { tokens });
        v2_1.logger.info(`Sending multicast notification to user ${target} (${tokens.length} tokens) by admin ${adminUid}`);
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
            read: false,
        };
        if (target !== "all") {
            await db.ref(`/users/${target}/notifications`).push(notificationRecord);
        }
        else {
            await db.ref("/notifications").push(notificationRecord);
        }
        v2_1.logger.info("Notification sent and recorded successfully.");
        return { success: true, message: "Notification sent successfully." };
    }
    catch (error) {
        v2_1.logger.error("Error sending notification:", error);
        throw new https_1.HttpsError("internal", "Failed to send notification.", error);
    }
});
//# sourceMappingURL=sendNotification.js.map