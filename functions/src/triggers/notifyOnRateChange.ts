
import {onValueWritten} from "firebase-functions/v2/database";
import {logger} from "firebase-functions/v2";
import * as OneSignal from "onesignal-node";

export const notifyOnRateChange = onValueWritten(
  {
    ref: "/settings/exchangeControl/currentRate",
    region: "asia-southeast1",
    secrets: ["ONE_SIGNAL_APP_ID", "ONE_SIGNAL_API_KEY"],
  },
  async (event) => {
    // Exit if the data was deleted.
    if (!event.data.after.exists()) {
      logger.info("Rate was deleted, no notification sent.");
      return;
    }

    const oldRate = event.data.before.val();
    const newRate = event.data.after.val();

    // Exit if the rate hasn't changed.
    if (oldRate === newRate) {
      logger.info(`Rate has not changed. Old: ${oldRate}, New: ${newRate}. No notification sent.`);
      return;
    }
    
    // Don't notify on initial creation
    if (!event.data.before.exists()) {
        logger.info(`Rate was created with value: ${newRate}. No notification sent on initial creation.`);
        return;
    }

    const title = "تحديث سعر الصرف";
    const body = `تم تحديث سعر صرف الدينار الليبي مقابل الجنيه المصري. السعر الجديد: ${newRate.toFixed(2)}`;

    const oneSignalClient = new OneSignal.Client(
      process.env.ONE_SIGNAL_APP_ID!,
      process.env.ONE_SIGNAL_API_KEY!
    );

    const notification = {
      contents: {
        en: body,
        ar: body,
      },
      headings: {
        en: title,
        ar: title,
      },
      included_segments: ["All"],
    };

    try {
      const response = await oneSignalClient.createNotification(notification);
      logger.info("Notification sent successfully:", response.body);
    } catch (error: any) {
      logger.error("Error sending notification:", error);
      if (error.response) {
        logger.error("OneSignal response body:", error.response.body);
      }
    }
  }
);
