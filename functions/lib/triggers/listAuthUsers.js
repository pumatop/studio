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
exports.listAuthUsers = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
/**
 * وظيفة لجلب قائمة المستخدمين من نظام المصادقة (Auth).
 * لا يمكن الوصول إليها إلا من قبل المسؤولين.
 */
exports.listAuthUsers = (0, https_1.onCall)({ region: "asia-southeast1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "يجب تسجيل الدخول لاستخدام هذه الخاصية.");
    }
    const callerUid = request.auth.uid;
    try {
        const callerSnap = await admin.database().ref(`/users/${callerUid}`).once("value");
        const callerData = callerSnap.val();
        if (!callerData || (callerData.role !== "admin" && callerData.role !== "superadmin")) {
            throw new https_1.HttpsError("permission-denied", "ليس لديك صلاحية لعرض قائمة المستخدمين.");
        }
        const listUsersResult = await admin.auth().listUsers(1000);
        return {
            success: true,
            users: listUsersResult.users.map((user) => ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                lastSignInTime: user.metadata.lastSignInTime,
            })),
        };
    }
    catch (error) {
        console.error("Error listing users:", error);
        throw new https_1.HttpsError("internal", "حدث خطأ أثناء جلب المستخدمين.");
    }
});
//# sourceMappingURL=listAuthUsers.js.map