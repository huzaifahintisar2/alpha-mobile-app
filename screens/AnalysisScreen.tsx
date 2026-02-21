import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase.client";
import DateTimePicker from "@react-native-community/datetimepicker";

/* =========================
   DATE HELPERS (LOCAL DATE)
========================= */
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

/* =========================
   MAIN SCREEN
========================= */
export default function AnalysisScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [analysisList, setAnalysisList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const loadAnalysis = async (date: Date) => {
    setLoading(true);
    setAnalysisList([]);

    try {
      const q = query(
        collection(db, "analysis_v1"),
        where("date", "==", formatDate(date)),
        orderBy("createdAt", "asc") // 🔴 requires Firestore index
      );

      const snap = await getDocs(q);

      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      setAnalysisList(list);
    } catch (err) {
      console.log("Analysis fetch error:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAnalysis(selectedDate);
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* DATE CONTROLS */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={styles.buttonText}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setSelectedDate(getYesterday())}
          >
            <Text style={styles.buttonText}>Yesterday</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.buttonText}>Select Date</Text>
          </TouchableOpacity>
        </View>

        {/* DATE PICKER */}
        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowPicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}

        {/* CONTENT */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#9ca3af" />
          </View>
        ) : analysisList.length > 0 ? (
          <FlatList
            data={analysisList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* IMAGE */}
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : null}

                {/* CAPTION */}
                <Text style={styles.caption}>{item.caption}</Text>

                {/* DATE */}
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              No analysis for this date
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f1720",
  },
  container: {
    flex: 1,
    padding: 14,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#1b2430",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  buttonText: {
    color: "#e5e7eb",
    fontWeight: "600",
    fontSize: 13,
  },

  card: {
    backgroundColor: "#1b2430",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },

  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },

  caption: {
    color: "#e5e7eb",
    fontSize: 15,
    lineHeight: 22,
  },

  dateText: {
    marginTop: 8,
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "right",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
  },
});
