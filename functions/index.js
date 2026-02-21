const admin = require("firebase-admin");
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { Expo } = require("expo-server-sdk");

admin.initializeApp();

const expo = new Expo();

/**
 * 🚨 NEW SIGNAL → EXPO PUSH
 * Fires when a new signal is created
 */
exports.onNewSignal = onDocumentCreated(
  "signals_v2/{signalId}",
  async (event) => {
    const signal = event.data.data();

    const tokensSnapshot = await admin
      .firestore()
      .collection("push_tokens")
      .get();

    if (tokensSnapshot.empty) {
      console.log("❌ No push tokens found");
      return;
    }

    const messages = [];

    tokensSnapshot.forEach((doc) => {
      const token = doc.id;
      if (!Expo.isExpoPushToken(token)) return;

      messages.push({
        to: token,
        sound: "default",
        title: "🚨 New Signal",
        body: `${signal.pair} ${signal.type} | Entry ${signal.entry} | TP ${signal.tp} | SL ${signal.sl}`,
        data: {
          type: "NEW_SIGNAL",
          signalId: event.params.signalId,
        },
      });
    });

    for (const chunk of expo.chunkPushNotifications(messages)) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("❌ Expo new-signal push error:", error);
      }
    }
  }
);

/**
 * ✅ TP / ❌ SL → EXPO PUSH
 * Fires ONLY when status changes to TP / SL (case-insensitive)
 */
exports.onSignalResult = onDocumentUpdated(
  "signals_v2/{signalId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // 🛑 Ignore if status didn't change
    if (before.status === after.status) return;

    // Normalize status (TP, tp, SL, sl, etc.)
    const status = String(after.status || "").toLowerCase();

    // 🛑 Only react to TP or SL
    if (!["tp", "sl"].includes(status)) return;

    const isTP = status === "tp";

    const tokensSnapshot = await admin
      .firestore()
      .collection("push_tokens")
      .get();

    if (tokensSnapshot.empty) return;

    const messages = [];

    tokensSnapshot.forEach((doc) => {
      const token = doc.id;
      if (!Expo.isExpoPushToken(token)) return;

      messages.push({
        to: token,
        sound: "default",
        title: isTP ? "✅ TP HIT" : "❌ SL HIT",
        body: `${after.pair} ${after.type} | ${
          isTP ? "Target achieved 🎯" : "Loss controlled 🛡️"
        }`,
        data: {
          type: "RESULT",
          result: status.toUpperCase(), // TP / SL
          signalId: event.params.signalId,
        },
      });
    });

    for (const chunk of expo.chunkPushNotifications(messages)) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("❌ Expo result push error:", error);
      }
    }
  }
);

/**
 * 📊 DAILY ANALYSIS → EXPO PUSH
 * Fires when a new daily analysis is created
 */
exports.onDailyAnalysis = onDocumentCreated(
  "analysis_v1/{analysisId}",
  async (event) => {
    const analysis = event.data.data();

    const tokensSnapshot = await admin
      .firestore()
      .collection("push_tokens")
      .get();

    if (tokensSnapshot.empty) {
      console.log("❌ No push tokens found for daily analysis");
      return;
    }

    const messages = [];

    tokensSnapshot.forEach((doc) => {
      const token = doc.id;
      if (!Expo.isExpoPushToken(token)) return;

      messages.push({
        to: token,
        sound: "default",
        title: "📊 Daily Market Analysis",
        body:
          analysis.title ||
          analysis.summary ||
          "New daily market analysis is available",
        data: {
          type: "DAILY_ANALYSIS",
          analysisId: event.params.analysisId,
        },
      });
    });

    for (const chunk of expo.chunkPushNotifications(messages)) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("❌ Expo daily-analysis push error:", error);
      }
    }
  }
);
