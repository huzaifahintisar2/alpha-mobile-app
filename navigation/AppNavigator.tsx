import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import MenuScreen from "../screens/MenuScreen";
import SignalScreen from "../screens/SignalsScreen";
import AnalysisScreen from "../screens/AnalysisScreen"; // ✅ real screen

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Signals" component={SignalScreen} />
        <Stack.Screen name="Analysis" component={AnalysisScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
