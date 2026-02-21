import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// 🔥 Firestore imports
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.client"; // adjust path if needed

export async function registerForPushNotificationsAsync() {
  try {
    // ❌ Must be a real device
    if (!Device.isDevice) {
      console.log("❌ Must use physical device for push notifications");
      return null;
    }

    // 🔐 Check existing permission
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // 🔐 Request permission if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Push notification permission denied");
      return null;
    }

    // 📦 Get Expo project ID (required for Expo Push Tokens)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log("❌ Expo projectId not found");
      return null;
    }

    // 📲 Get Expo Push Token
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    console.log("📲 EXPO PUSH TOKEN:", token);

    // 💾 Save token to Firestore
    await setDoc(
      doc(db, "push_tokens", token),
      {
        token,
        platform: Platform.OS,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 🔔 Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  } catch (error) {
    console.log("❌ Push notification error:", error);
    return null;
  }
}
