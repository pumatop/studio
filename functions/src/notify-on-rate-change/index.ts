import { onValueWritten } from "firebase-functions/v2/database";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as OneSignal from "onesignal-node";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const notifyOnRateChange = onValueWritten({
  ref: "/settings/exchangeControl/currentRate",
  region: "asia-southeast1",
  secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"],
}, async (event) => {
  if (!event.data.after.exists()) return;

  const oldRate = event.data.before.val();
  const newRate = event.data.after.val();

  if (oldRate === newRate || !event.data.before.exists()) return;

  const title = "تحديث سعر الصرف";
  const body = `تم تحديث سعر صرف الدينار الليبي مقابل الجنيه المصري. السعر الجديد: ${Number(newRate).toFixed(2)}`;

  const appId = process.env.ONE_SIGNAL_APP_ID;
  const apiKey = process.env.ONE_SIGNAL_API_KEY;

  if (!appId || !apiKey) {
    logger.error("OneSignal configuration missing.");
    return;
  }

  const oneSignalClient = new OneSignal.Client(appId, apiKey);
  const notification = {
    contents: { en: body, ar: body },
    headings: { en: title, ar: title },
    included_segments: ["All"],
  };

  try {
    await oneSignalClient.createNotification(notification);
    logger.info("Notification sent successfully.");
  } catch (error) {
    logger.error("Error sending notification:", error);
  }
});
