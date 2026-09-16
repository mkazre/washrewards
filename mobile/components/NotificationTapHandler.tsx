import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

/**
 * Routes a tapped push notification to the relevant screen, mirroring the
 * `type` set on each AppNotification server-side. Renders nothing — this
 * only registers a listener for the lifetime of the app.
 */
export function NotificationTapHandler() {
  const router = useRouter();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string } | undefined;

      switch (data?.type) {
        case "voucher_earned":
          router.push("/(tabs)/rewards");
          break;
        case "partner_new_booking":
          router.push("/(tabs)/partner");
          break;
        case "booking_paid":
        case "booking_status":
          router.push("/(tabs)/home");
          break;
        default:
          router.push("/notifications");
      }
    });

    return () => sub.remove();
  }, [router]);

  return null;
}
