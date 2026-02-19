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
exports.manageUserSessions = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const db = admin.database();
exports.manageUserSessions = (0, https_1.onCall)({ region: "asia-southeast1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const adminUid = request.auth.uid;
    const adminUserRef = db.ref(`/users/${adminUid}`);
    const adminUserSnapshot = await adminUserRef.get();
    const adminUserData = adminUserSnapshot.val();
    if (!adminUserData || adminUserData.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only administrators can manage user sessions.");
    }
    const { userId, sessionId, action } = request.data;
    if (!userId || typeof userId !== "string") {
        throw new https_1.HttpsError("invalid-argument", "The 'userId' parameter must be a non-empty string.");
    }
    if (action === "deleteAll") {
        v2_1.logger.info(`Admin ${adminUid} is deleting all sessions for user ${userId}.`);
        const sessionsRef = db.ref(`/users/${userId}/sessions`);
        try {
            await sessionsRef.remove();
            return { success: true, message: `All sessions for user ${userId} have been deleted.` };
        }
        catch (error) {
            v2_1.logger.error(`Error deleting all sessions for user ${userId}:`, error);
            throw new https_1.HttpsError("internal", "Could not delete all user sessions.");
        }
    }
    else if (sessionId && typeof sessionId === "string") {
        v2_1.logger.info(`Admin ${adminUid} is deleting session '${sessionId}' for user ${userId}.`);
        const sessionRef = db.ref(`/users/${userId}/sessions/${sessionId}`);
        try {
            await sessionRef.remove();
            return { success: true, message: `Session '${sessionId}' for user ${userId} has been deleted.` };
        }
        catch (error) {
            v2_1.logger.error(`Error deleting session '${sessionId}' for user ${userId}:`, error);
            throw new https_1.HttpsError("internal", `Could not delete session '${sessionId}'.`);
        }
    }
    else {
        throw new https_1.HttpsError("invalid-argument", "The function must be called with a 'sessionId' or with the 'action' set to 'deleteAll'.");
    }
});
//# sourceMappingURL=manageUserSessions.js.map