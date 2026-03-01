"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/send-notification/index.ts
var index_exports = {};
__export(index_exports, {
  sendnotification: () => sendnotification
});
module.exports = __toCommonJS(index_exports);
var import_https = require("firebase-functions/v2/https");
var admin = __toESM(require("firebase-admin"));
var import_v2 = require("firebase-functions/v2");
var OneSignal = __toESM(require("onesignal-node"));
if (!admin.apps.length) {
  admin.initializeApp();
}
var db = admin.database();
var sendnotification = (0, import_https.onCall)(
  { region: "asia-southeast1", secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"] },
  async (request) => {
    const appId = process.env.ONE_SIGNAL_APP_ID;
    const apiKey = process.env.ONE_SIGNAL_API_KEY;
    if (!appId || !apiKey) {
      throw new import_https.HttpsError("internal", "OneSignal configuration is missing.");
    }
    const oneSignalClient = new OneSignal.Client(appId, apiKey);
    if (!request.auth) {
      throw new import_https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const adminUid = request.auth.uid;
    const { title, body, imageUrl, type, target } = request.data;
    if (!title || !body || !type || !target) {
      throw new import_https.HttpsError("invalid-argument", "Missing required notification fields.");
    }
    const notificationRecord = {
      title,
      body,
      imageUrl: imageUrl || null,
      type,
      target,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      sentBy: adminUid
    };
    const oneSignalNotification = {
      contents: { en: body },
      headings: { en: title }
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
          throw new import_https.HttpsError("not-found", `Notification settings for user ${target} not found.`);
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
    } catch (error) {
      if (error instanceof import_https.HttpsError) throw error;
      import_v2.logger.error("Error sending notification:", error);
      throw new import_https.HttpsError("internal", "Failed to send notification.");
    }
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sendnotification
});
