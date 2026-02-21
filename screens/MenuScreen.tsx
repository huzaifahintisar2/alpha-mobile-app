import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { registerForPushNotificationsAsync } from "../utils/registerForPushNotifications";

type Props = {
  navigation: any;
};

export default function MenuScreen({ navigation }: Props) {
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      console.log("📲 EXPO PUSH TOKEN:", token);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={["#0b1118", "#0e1621", "#0b1118"]}
        style={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../assets/forex-pros-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.brand}>Forex Pros</Text>
          <Text style={styles.subBrand}>Professional market signals</Text>

          <View style={styles.divider} />
        </View>

        {/* MENU */}
        <View style={styles.menu}>
          <MenuCard
            title="Signals"
            subtitle="Live market calls"
            image={require("../assets/icon-signals.png")}
            glowColor="rgba(34,197,94,0.8)"
            onPress={() => navigation.navigate("Signals")}
          />

          <MenuCard
            title="Today's Analysis"
            subtitle="Daily market bias"
            image={require("../assets/icon-analysis.png")}
            glowColor="rgba(59,130,246,0.8)"
            onPress={() => navigation.navigate("Analysis")}
          />

          <MenuCard
            title="About"
            subtitle="Who we are & disclaimer"
            image={require("../assets/icon-about.png")}
            glowColor="rgba(156,163,175,0.8)"
            onPress={() => navigation.navigate("About")}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* =========================
   MENU CARD
========================= */
function MenuCard({
  title,
  subtitle,
  image,
  glowColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  image: any;
  glowColor: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.04,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(glow, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(glow, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.04)", glowColor],
  });

  const shadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const iconOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale }],
            borderColor,
            shadowColor: glowColor,
            shadowOpacity,
            shadowRadius: 20,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <Animated.Image
            source={image}
            style={[styles.cardIcon, { opacity: iconOpacity }]}
            resizeMode="contain"
          />

          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSub}>{subtitle}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0b1118",
  },

  container: {
    flex: 1,
  },

  header: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 32,
  },

  logoWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#0f1720",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#22c55e",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  logo: {
    width: 72,
    height: 72,
  },

  brand: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },

  subBrand: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 6,
  },

  divider: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 28,
  },

  menu: {
    paddingHorizontal: 18,
    paddingTop: 26,
  },

  card: {
    backgroundColor: "#141d27",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardIcon: {
    width: 46,
    height: 46,
    marginRight: 16,
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },

  cardSub: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 6,
  },
});
