
// This file is the main entry point for Firebase Functions.
// It initializes the Firebase Admin SDK and exports all functions
// from their individual files in the `triggers` directory.

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

// Import and export functions from their individual files.
// This allows Firebase to discover and deploy them.
export * from "./triggers/deleteSupervisor";
export * from "./triggers/handleAutoExchangeStatus";
export * from "./triggers/listAuthUsers";
export * from "./triggers/manageUserSessions";
export * from "./triggers/notifyOnRateChange";
export * from "./triggers/processScheduledRateChanges";
export * from "./triggers/processTransactionBasedRateChanges";
export * from "./triggers/sendNotification";
export * from "./triggers/updateOneSignalPlayerId";
export * from "./triggers/updateTransferStatus";
