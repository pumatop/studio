"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupervisor = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.deleteSupervisor = functions.https.onCall(async (data, context) => {
    var _a;
    // 1. Authentication Check: Ensure the user is authenticated.
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called by an authenticated user.");
    }
    // 2. Admin Check: Verify the calling user is an admin.
    const callerUid = context.auth.uid;
    let isAdmin = false;
    try {
        const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
        isAdmin = ((_a = callerSnap.val()) === null || _a === void 0 ? void 0 : _a.role) === "admin";
    }
    catch (e) {
        functions.logger.error("Error checking admin status:", e);
        throw new functions.https.HttpsError("internal", "Could not verify admin status.");
    }
    if (!isAdmin) {
        throw new functions.https.HttpsError("permission-denied", "Only admins can delete supervisors.");
    }
    // 3. UID Validation: Check if the UID to delete is provided.
    const uidToDelete = data.uid;
    if (!uidToDelete || typeof uidToDelete !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a valid \"uid\" string.");
    }
    try {
        // 4. Delete from Auth
        await admin.auth().deleteUser(uidToDelete);
        functions.logger.info(`Successfully deleted user ${uidToDelete} from Authentication.`);
        // 5. Delete from Realtime Database
        const dbRef = admin.database().ref(`/supervisors/${uidToDelete}`);
        await dbRef.remove();
        functions.logger.info(`Successfully deleted supervisor data for ${uidToDelete} from Realtime Database.`);
        return { success: true, message: `Supervisor ${uidToDelete} has been completely deleted.` };
    }
    catch (error) {
        functions.logger.error(`Error deleting supervisor ${uidToDelete}:`, error);
        // If the user is already deleted from Auth, we can still try to clean up the database.
        if (error.code === "auth/user-not-found") {
            const dbRef = admin.database().ref(`/supervisors/${uidToDelete}`);
            await dbRef.remove();
            functions.logger.warn(`User ${uidToDelete} was not found in Auth, but their data was cleaned up from the database.`);
            return { success: true, message: "User was already deleted from Authentication. Database cleanup successful." };
        }
        throw new functions.https.HttpsError("internal", error.message, error.details);
    }
});
//# sourceMappingURL=deleteSupervisor.js.map