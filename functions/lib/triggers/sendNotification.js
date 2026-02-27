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
const OneSignal = __importStar(require("onesignal-node"));
// Initialize the Firebase Admin SDK
const db = admin.database();
exports.sendNotification = (0, https_1.onCall)({ region: "asia-southeast1", secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"] }, async (request) => {
    const appId = process.env.ONE_SIGNAL_APP_ID;
    const apiKey = process.env.ONE_SIGNAL_API_KEY;
    if (!appId || !apiKey) {
        throw new https_1.HttpsError("internal", "OneSignal configuration is missing.");
    }
    // OneSignal Client Initialization
    const oneSignalClient = new OneSignal.Client(appId, apiKey);
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const adminUid = request.auth.uid;
    const { title, body, imageUrl, type, target, } = request.data;
    if (!title || !body || !type || !target) {
        throw new https_1.HttpsError("invalid-argument", "Missing required notification fields.");
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
    const oneSignalNotification = {
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
            v2_1.logger.info(`Notification for 'all' sent by admin ${adminUid}`);
            return {
                success: true,
                message: "Notification sent to all users successfully.",
            };
        }
        else {
            // --- New logic for sending to a specific user via tags ---
            // 1. Get user's notification settings
            const settingsSnapshot = await db.ref(`/users/${target}/notificationSettings`).get();
            if (!settingsSnapshot.exists()) {
                throw new https_1.HttpsError("not-found", `Notification settings for user ${target} not found.`);
            }
            const settings = settingsSnapshot.val();
            // 2. Check if the user is subscribed
            if (!settings.isSubscribed) {
                v2_1.logger.warn(`User ${target} is not subscribed to notifications.`);
                // Return a success message but don't send the notification
                return {
                    success: true, // It's not a server failure
                    message: `User ${target} is not subscribed to notifications.`,
                };
            }
            // 3. Send to specific user via OneSignal Tags
            oneSignalNotification.filters = [
                { field: "tag", key: "user_id", relation: "=", value: target },
            ];
            await oneSignalClient.createNotification(oneSignalNotification);
            // 4. Log to RTDB for history
            await db.ref(`/users/${target}/notifications`).push(notificationRecord);
            v2_1.logger.info(`Notification for user ${target} sent by admin ${adminUid} via tags`);
            return {
                success: true,
                message: "Notification for user sent successfully via tags.",
            };
        }
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        v2_1.logger.error("Error sending notification:", error);
        throw new https_1.HttpsError("internal", "Failed to send notification.");
    }
});
//# sourceMappingURL=sendNotification.js.map