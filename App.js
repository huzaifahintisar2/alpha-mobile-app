import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import AppNavigator from "./navigation/AppNavigator";

// 🔔 How notifications behave when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Ask permission once
    Notifications.requestPermissionsAsync();
  }, []);

  return <AppNavigator />;
}
