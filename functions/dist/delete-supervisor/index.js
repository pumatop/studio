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

// src/delete-supervisor/index.ts
var index_exports = {};
__export(index_exports, {
  deletesupervisor: () => deletesupervisor
});
module.exports = __toCommonJS(index_exports);
var import_https = require("firebase-functions/v2/https");
var admin = __toESM(require("firebase-admin"));
if (!admin.apps.length) {
  admin.initializeApp();
}
var deletesupervisor = (0, import_https.onCall)({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) {
    throw new import_https.HttpsError("unauthenticated", "The function must be called by an authenticated user.");
  }
  const callerUid = request.auth.uid;
  let isAdmin = false;
  try {
    const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
    isAdmin = callerSnap.val()?.role === "admin";
  } catch (e) {
    throw new import_https.HttpsError("internal", "Could not verify admin status.");
  }
  if (!isAdmin) {
    throw new import_https.HttpsError("permission-denied", "Only admins can delete supervisors.");
  }
  const uidToDelete = request.data.uid;
  if (!uidToDelete || typeof uidToDelete !== "string") {
    throw new import_https.HttpsError("invalid-argument", 'The function must be called with a valid "uid" string.');
  }
  try {
    await admin.auth().deleteUser(uidToDelete);
    const dbRef = admin.database().ref(`/supervisors/${uidToDelete}`);
    await dbRef.remove();
    return { success: true, message: `Supervisor ${uidToDelete} has been completely deleted.` };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      const dbRef = admin.database().ref(`/supervisors/${uidToDelete}`);
      await dbRef.remove();
      return { success: true, message: "User was already deleted from Authentication. Database cleanup successful." };
    }
    throw new import_https.HttpsError("internal", error.message);
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deletesupervisor
});
