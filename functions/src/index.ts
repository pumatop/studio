// This file is the main entry point for Firebase Functions.
// It initializes the Firebase Admin SDK and exports all functions
// from their individual files in the `triggers` directory.

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK. This must be done only once.
admin.initializeApp();

// Import and export functions from their individual files.
// This allows Firebase to discover and deploy them.
export * from "./triggers/handleAutoExchangeStatus";
export * from "./triggers/processScheduledRateChanges";
export * from "./triggers/processTransactionBasedRateChanges";
