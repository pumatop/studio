
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as OneSignal from "onesignal-node";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const sendNotification = onCall(
  { region: "asia-southeast1", secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"] },
  async (request) => {
    const appId = process.env.ONE_SIGNAL_APP_ID;
    const apiKey = process.env.ONE_SIGNAL_API_KEY;

    if (!appId || !apiKey) {
      throw new HttpsError("internal", "OneSignal config missing.");
    }

    const client = new OneSignal.Client(appId, apiKey);
    const { title, body, imageUrl, target } = request.data;

    const notification: any = {
      contents: { en: body, ar: body },
      headings: { en: title, ar: title },
    };

    if (imageUrl) notification.big_picture = imageUrl;

    try {
      if (target === "all") {
        notification.included_segments = ["All"];
      } else {
        notification.filters = [{ field: "tag", key: "user_id", relation: "=", value: target }];
      }

      await client.createNotification(notification);
      return { success: true };
    } catch (error: any) {
      throw new HttpsError("internal", error.message);
    }
  }
);
