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

// src/list-auth-users/index.ts
var index_exports = {};
__export(index_exports, {
  listAuthUsers: () => listAuthUsers
});
module.exports = __toCommonJS(index_exports);
var import_https = require("firebase-functions/v2/https");
var admin = __toESM(require("firebase-admin"));
if (!admin.apps.length) {
  admin.initializeApp();
}
var listAuthUsers = (0, import_https.onCall)({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new import_https.HttpsError("unauthenticated", "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u062E\u0627\u0635\u064A\u0629.");
  }
  const callerUid = request.auth.uid;
  try {
    const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
    const callerData = callerSnap.val();
    if (!callerData || callerData.role !== "admin" && callerData.role !== "superadmin") {
      throw new import_https.HttpsError("permission-denied", "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0644\u0639\u0631\u0636 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646.");
    }
    const listUsersResult = await admin.auth().listUsers(1e3);
    return {
      success: true,
      users: listUsersResult.users.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        lastSignInTime: user.metadata.lastSignInTime
      }))
    };
  } catch (error) {
    console.error("Error listing users:", error);
    throw new import_https.HttpsError("internal", "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062C\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646.");
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  listAuthUsers
});
