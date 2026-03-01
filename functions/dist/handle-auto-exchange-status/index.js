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

// src/handle-auto-exchange-status/index.ts
var index_exports = {};
__export(index_exports, {
  handleautoexchangestatus: () => handleautoexchangestatus
});
module.exports = __toCommonJS(index_exports);
var import_database = require("firebase-functions/v2/database");
var admin = __toESM(require("firebase-admin"));
var import_v2 = require("firebase-functions/v2");
if (!admin.apps.length) {
  admin.initializeApp();
}
var db = admin.database();
var handleautoexchangestatus = (0, import_database.onValueWritten)(
  {
    ref: "/dailyAggregates/{date}",
    region: "asia-southeast1"
  },
  async (event) => {
    const settingsRef = db.ref("/settings/exchangeControl");
    const settingsSnap = await settingsRef.get();
    const settings = settingsSnap.val();
    if (settings?.mode !== "auto" || !settings.isOpen) {
      import_v2.logger.info("Auto-close is disabled (mode is not 'auto' or exchange is already closed).");
      return;
    }
    const aggregate = event.data.after.val();
    if (!aggregate || typeof aggregate.totalEgpAmount === "undefined") {
      import_v2.logger.info("No aggregate data found to process for auto-close check.");
      return;
    }
    const newTotalAmount = aggregate.totalEgpAmount;
    if (newTotalAmount >= settings.autoCloseThreshold) {
      import_v2.logger.info(`Auto-close threshold met. Total: ${newTotalAmount}, Threshold: ${settings.autoCloseThreshold}. Closing exchange.`);
      await settingsRef.update({ isOpen: false });
    }
    return;
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handleautoexchangestatus
});
