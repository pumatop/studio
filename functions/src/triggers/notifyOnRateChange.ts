import { onValueWritten } from "firebase-functions/v2/database";
import * as admin from "firebase-admin";
import * as OneSignal from "onesignal-node";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const notifyOnRateChange = onValueWritten(
  {
    ref: "/settings/exchangeControl/currentRate",
    region: "asia-southeast1",
    secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"],
  },
  async (event) => {
    if (!event.data.after.exists()) return;

    const oldRate = event.data.before.val();
    const newRate = event.data.after.val();

    if (oldRate === newRate || !event.data.before.exists()) return;

    const appId = process.env.ONE_SIGNAL_APP_ID!;
    const apiKey = process.env.ONE_SIGNAL_API_KEY!;
    const client = new OneSignal.Client(appId, apiKey);

    const title = "تحديث سعر الصرف";
    const body = `تم تحديث سعر صرف الدينار الليبي مقابل الجنيه المصري. السعر الجديد: ${Number(newRate).toFixed(2)}`;

    try {
      await client.createNotification({
        contents: { en: body, ar: body },
        headings: { en: title, ar: title },
        included_segments: ["All"],
      });
    } catch (e) {
      console.error("Error sending rate notification:", e);
    }
  }
);