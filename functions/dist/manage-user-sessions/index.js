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

// src/manage-user-sessions/index.ts
var index_exports = {};
__export(index_exports, {
  manageUserSessions: () => manageUserSessions
});
module.exports = __toCommonJS(index_exports);
var import_https = require("firebase-functions/v2/https");
var admin = __toESM(require("firebase-admin"));
if (!admin.apps.length) {
  admin.initializeApp();
}
var db = admin.database();
var manageUserSessions = (0, import_https.onCall)({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new import_https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const adminUid = request.auth.uid;
  const adminUserRef = db.ref(`/users/${adminUid}`);
  const adminUserSnapshot = await adminUserRef.get();
  const adminUserData = adminUserSnapshot.val();
  if (!adminUserData) {
    throw new import_https.HttpsError("permission-denied", `Permission denied. User profile not found.`);
  }
  if (adminUserData.role !== "admin" && adminUserData.role !== "superadmin") {
    throw new import_https.HttpsError("permission-denied", "User does not have admin role.");
  }
  const { userId, sessionId, action } = request.data;
  if (!userId) {
    throw new import_https.HttpsError("invalid-argument", "The 'userId' parameter is required.");
  }
  if (action === "deleteAll") {
    const sessionsRef = db.ref(`/users/${userId}/sessions`);
    try {
      await sessionsRef.remove();
      return { success: true, message: `All sessions deleted.` };
    } catch (error) {
      throw new import_https.HttpsError("internal", "Could not delete all user sessions.");
    }
  } else if (sessionId) {
    const sessionRef = db.ref(`/users/${userId}/sessions/${sessionId}`);
    try {
      await sessionRef.remove();
      return { success: true, message: `Session deleted.` };
    } catch (error) {
      throw new import_https.HttpsError("internal", `Could not delete session.`);
    }
  } else {
    throw new import_https.HttpsError("invalid-argument", "Missing sessionId or action=deleteAll.");
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  manageUserSessions
});
