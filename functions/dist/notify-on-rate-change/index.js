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

// src/notify-on-rate-change/index.ts
var index_exports = {};
__export(index_exports, {
  notifyOnRateChange: () => notifyOnRateChange
});
module.exports = __toCommonJS(index_exports);
var import_database = require("firebase-functions/v2/database");
var import_v2 = require("firebase-functions/v2");
var admin = __toESM(require("firebase-admin"));
var OneSignal = __toESM(require("onesignal-node"));
if (!admin.apps.length) {
  admin.initializeApp();
}
var notifyOnRateChange = (0, import_database.onValueWritten)({
  ref: "/settings/exchangeControl/currentRate",
  region: "asia-southeast1",
  secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"]
}, async (event) => {
  if (!event.data.after.exists()) return;
  const oldRate = event.data.before.val();
  const newRate = event.data.after.val();
  if (oldRate === newRate || !event.data.before.exists()) return;
  const title = "\u062A\u062D\u062F\u064A\u062B \u0633\u0639\u0631 \u0627\u0644\u0635\u0631\u0641";
  const body = `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0633\u0639\u0631 \u0635\u0631\u0641 \u0627\u0644\u062F\u064A\u0646\u0627\u0631 \u0627\u0644\u0644\u064A\u0628\u064A \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u062C\u0646\u064A\u0647 \u0627\u0644\u0645\u0635\u0631\u064A. \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062C\u062F\u064A\u062F: ${Number(newRate).toFixed(2)}`;
  const appId = process.env.ONE_SIGNAL_APP_ID;
  const apiKey = process.env.ONE_SIGNAL_API_KEY;
  if (!appId || !apiKey) {
    import_v2.logger.error("OneSignal configuration missing.");
    return;
  }
  const oneSignalClient = new OneSignal.Client(appId, apiKey);
  const notification = {
    contents: { en: body, ar: body },
    headings: { en: title, ar: title },
    included_segments: ["All"]
  };
  try {
    await oneSignalClient.createNotification(notification);
    import_v2.logger.info("Notification sent successfully.");
  } catch (error) {
    import_v2.logger.error("Error sending notification:", error);
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  notifyOnRateChange
});
