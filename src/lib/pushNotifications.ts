import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

/**
 * Client-side push registration (Milestone 9). `sendPushToProfile(s)`
 * (src/lib/push.ts) has been wired into lifecycle routes since M2 — every
 * send was a silent no-op until a real token flow existed. This is that flow.
 */

export type RegisterResult =
  | { status: "granted"; token: string }
  | { status: "denied" | "undetermined" | "unsupported" };

export async function registerForPushNotificationsAsync(): Promise<RegisterResult> {
  if (!Device.isDevice) {
    return { status: "unsupported" };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status === "undetermined") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    return { status: status === "denied" ? "denied" : "undetermined" };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return { status: "granted", token };
}
