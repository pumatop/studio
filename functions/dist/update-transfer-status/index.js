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

// src/update-transfer-status/index.ts
var index_exports = {};
__export(index_exports, {
  updatetransferstatus: () => updatetransferstatus
});
module.exports = __toCommonJS(index_exports);
var import_https = require("firebase-functions/v2/https");
var admin = __toESM(require("firebase-admin"));
if (!admin.apps.length) {
  admin.initializeApp();
}
var db = admin.database();
var updatetransferstatus = (0, import_https.onCall)({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) throw new import_https.HttpsError("unauthenticated", "Auth required.");
  const { transferId, status, receiptUrl } = request.data;
  if (!transferId || !status) throw new import_https.HttpsError("invalid-argument", "Missing params.");
  const transferRef = db.ref(`/admin/pending_egypt_transfers/${transferId}`);
  const snap = await transferRef.get();
  const transfer = snap.val();
  if (!transfer) throw new import_https.HttpsError("not-found", "Not found.");
  const deduction = Number(transfer.totalDeduction || 0);
  const userRef = db.ref(`/users/${transfer.userId}`);
  await userRef.transaction((user) => {
    if (user) {
      user.balanceEgyptianPending = Math.max(0, (user.balanceEgyptianPending || 0) - deduction);
      if (status === "failed") user.balanceEGP = (user.balanceEGP || 0) + deduction;
      user.lastUpdate = Date.now();
    }
    return user;
  });
  const update = { ...transfer, status, receiptUrl: receiptUrl || null };
  await db.ref(`/users/${transfer.userId}/transactions/${transferId}`).set(update);
  await transferRef.remove();
  return { success: true };
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  updatetransferstatus
});
