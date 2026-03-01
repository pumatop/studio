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

// src/process-transaction-based-rate-changes/index.ts
var index_exports = {};
__export(index_exports, {
  processTransactionBasedRateChanges: () => processTransactionBasedRateChanges
});
module.exports = __toCommonJS(index_exports);
var import_database = require("firebase-functions/v2/database");
var admin = __toESM(require("firebase-admin"));
if (!admin.apps.length) {
  admin.initializeApp();
}
var db = admin.database();
var processTransactionBasedRateChanges = (0, import_database.onValueCreated)({
  ref: "/users/{userId}/transactions/{transactionId}",
  region: "asia-southeast1"
}, async (event) => {
  const transaction = event.data.val();
  if (transaction.type !== "egypt_transfer" || transaction.status !== "completed") return;
  const date = new Date(transaction.timestamp).toISOString().split("T")[0];
  const aggregateRef = db.ref(`/dailyAggregates/${date}`);
  const { committed, snapshot: aggSnap } = await aggregateRef.transaction((current) => {
    if (current === null) return { totalEgpAmount: transaction.amountEGP };
    return { totalEgpAmount: current.totalEgpAmount + transaction.amountEGP };
  });
  if (!committed) return;
  const settingsSnap = await db.ref("/settings/exchangeControl").get();
  const settings = settingsSnap.val();
  if (!settings?.autoConditionsActive || !settings.conditions) return;
  const newTotal = aggSnap.val().totalEgpAmount;
  const updates = {};
  let rateChanged = false;
  const amountConditions = Object.entries(settings.conditions).filter(([, c]) => c.type === "amount").sort(([, a], [, b]) => a.value - b.value);
  for (const [id, condition] of amountConditions) {
    if (newTotal >= condition.value) {
      updates["/settings/exchangeControl/currentRate"] = condition.targetRate;
      const logId = db.ref("/exchangeRateLogs").push().key;
      updates[`/exchangeRateLogs/${logId}`] = {
        date: (/* @__PURE__ */ new Date()).toISOString(),
        modifiedBy: "\u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A",
        oldRate: settings.currentRate,
        newRate: condition.targetRate,
        currencyPair: "LYD/EGP"
      };
      updates[`/settings/exchangeControl/conditions/${id}`] = null;
      rateChanged = true;
      break;
    }
  }
  if (rateChanged) await db.ref().update(updates);
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  processTransactionBasedRateChanges
});
