import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../firebase.client";

/* =========================
   HELPERS
========================= */

const formatDateTime = (timestamp: any) => {
  if (!timestamp?.toDate) return "-";
  const d = timestamp.toDate();
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const goldPips = (a: number, b: number) =>
  Math.round(Math.abs(a - b) * 10);

/* =========================
   STATUS BADGE
========================= */
const StatusBadge = ({ status }: { status: string }) => {
  const map: any = {
    RUNNING: { bg: "#1e3a8a", text: "#e5e7eb" },
    TP: { bg: "#14532d", text: "#7ee0b8" },
    SL: { bg: "#7f1d1d", text: "#ff9b9b" },
  };

  const s = map[status];

  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusText, { color: s.text }]}>
        {status === "RUNNING" ? "RUNNING" : status === "TP" ? "TP HIT" : "SL HIT"}
      </Text>
    </View>
  );
};

/* =========================
   SIGNAL CARD
========================= */
const SignalCard = ({ item }: any) => {
  const isBuy = item.side === "BUY";
  const tpPips =
    typeof item.tp === "number" && typeof item.entry === "number"
      ? goldPips(item.tp, item.entry)
      : null;
  const slPips =
    typeof item.sl === "number" && typeof item.entry === "number"
      ? goldPips(item.sl, item.entry)
      : null;

  return (
    <LinearGradient colors={["#161e2a", "#0f1621"]} style={styles.card}>
      <View style={styles.goldLine} />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pair}>{item.pair}</Text>
          <View
            style={[
              styles.sideBadge,
              { backgroundColor: isBuy ? "#14532d" : "#7f1d1d" },
            ]}
          >
            <Text style={styles.sideText}>
              {isBuy ? "📈 BUY" : "📉 SELL"}
            </Text>
          </View>
        </View>

        <StatusBadge status={item.status} />
      </View>

      <View style={styles.separator} />

      <InfoRow label="⏱ Time" value={formatDateTime(item.createdAt)} />
      <InfoRow label="🎯 Entry" value={item.entry} />
      <InfoRow label="✅ Take Profit" value={item.tp} />
      <InfoRow label="🛑 Stop Loss" value={item.sl} />

      {/* RUNNING INFO */}
      {item.status === "RUNNING" && tpPips !== null && slPips !== null && (
        <>
          <View style={styles.separator} />
          <Text style={styles.runningInfo}>
            📊 TP ({tpPips} pips) · SL ({slPips} pips)
          </Text>
        </>
      )}

      {/* RESULT */}
      {item.status !== "RUNNING" && (
        <>
          <View style={styles.separator} />
          {typeof item.tp_pips === "number" && (
            <Text style={styles.green}>🟢 +{item.tp_pips} pips</Text>
          )}
          {typeof item.sl_pips === "number" && (
            <Text style={styles.red}>🔴 -{item.sl_pips} pips</Text>
          )}
        </>
      )}
    </LinearGradient>
  );
};

const InfoRow = ({ label, value }: any) => (
  <>
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "-"}</Text>
    </View>
    <View style={styles.separator} />
  </>
);

/* =========================
   MAIN SCREEN
========================= */
export default function SignalScreen() {
  const [tab, setTab] = useState<"RUNNING" | "HISTORY">("RUNNING");
  const [signals, setSignals] = useState<any[]>([]);

  const [filter, setFilter] = useState("Today");
  const [showMenu, setShowMenu] = useState(false);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [pickMode, setPickMode] = useState<"FROM" | "TO" | null>(null);

  useEffect(() => {
    const q = query(collection(db, "signals_v2"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setSignals(list);
    });
    return () => unsub();
  }, []);

  const filteredSignals = useMemo(() => {
    let list =
      tab === "RUNNING"
        ? signals.filter((s) => s.status === "RUNNING")
        : signals.filter((s) => s.status !== "RUNNING");

    const now = new Date();

    if (filter === "Today") {
      list = list.filter(
        (s) =>
          s.createdAt?.toDate().toDateString() === now.toDateString()
      );
    }

    if (filter === "Last Week") {
      const week = new Date();
      week.setDate(now.getDate() - 7);
      list = list.filter((s) => s.createdAt?.toDate() >= week);
    }

    if (filter === "Last 3 Months") {
      const m = new Date();
      m.setMonth(now.getMonth() - 3);
      list = list.filter((s) => s.createdAt?.toDate() >= m);
    }

    if (filter === "Custom" && fromDate && toDate) {
      list = list.filter((s) => {
        const d = s.createdAt?.toDate();
        return d >= fromDate && d <= toDate;
      });
    }

    return list;
  }, [signals, tab, filter, fromDate, toDate]);

  const stats = useMemo(() => {
    const history = signals.filter((s) => s.status !== "RUNNING");
    const wins = history.filter((s) => s.status === "TP").length;
    const losses = history.filter((s) => s.status === "SL").length;
    const net =
      history.reduce((a, b) => a + (b.tp_pips || 0), 0) -
      history.reduce((a, b) => a + (b.sl_pips || 0), 0);

    return {
      wins,
      losses,
      winRate: history.length
        ? Math.round((wins / history.length) * 100)
        : 0,
      net,
    };
  }, [signals]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* TABS */}
      <View style={styles.tabs}>
        {["RUNNING", "HISTORY"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t as any)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={styles.tabText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FILTER */}
      {tab === "HISTORY" && (
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowMenu(true)}
        >
          <Text style={styles.filterText}>📅 {filter}</Text>
        </TouchableOpacity>
      )}

      {/* LIST */}
      <FlatList
        data={filteredSignals}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <SignalCard item={item} />}
        ListFooterComponent={
          tab === "HISTORY" && (
            <View style={styles.summary}>
              <Text style={styles.summaryText}>🏆 Win %: {stats.winRate}%</Text>
              <Text style={styles.summaryText}>✅ Wins: {stats.wins}</Text>
              <Text style={styles.summaryText}>❌ Losses: {stats.losses}</Text>
              <Text style={styles.summaryText}>
                ⭐ Net Pips: {stats.net}
              </Text>
            </View>
          )
        }
      />

      {/* FILTER MENU */}
      <Modal transparent visible={showMenu} animationType="fade">
        <TouchableOpacity
          style={styles.modalBg}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menu}>
            {["Today", "Last Week", "Last 3 Months", "Custom"].map((o) => (
              <TouchableOpacity
                key={o}
                onPress={() => {
                  setShowMenu(false);
                  if (o === "Custom") {
                    setFilter("Custom");
                    setPickMode("FROM");
                  } else {
                    setFilter(o);
                  }
                }}
              >
                <Text style={styles.menuItem}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DATE PICKER */}
      {pickMode && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="calendar"
          onChange={(e, d) => {
            if (!d) return setPickMode(null);
            if (pickMode === "FROM") {
              setFromDate(d);
              setPickMode("TO");
            } else {
              setToDate(d);
              setPickMode(null);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1118", padding: 14 },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 4,
    marginBottom: 14,
  },
  tab: { flex: 1, padding: 12, alignItems: "center" },
  tabActive: { backgroundColor: "#1f2937", borderRadius: 16 },
  tabText: { color: "#e5e7eb", fontWeight: "800" },

  card: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },

  goldLine: {
    position: "absolute",
    top: 0,
    left: 22,
    right: 22,
    height: 2,
    backgroundColor: "#d4af37",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  pair: { color: "#fff", fontSize: 16, fontWeight: "800" },

  sideBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },

  sideText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignSelf: "stretch",
    justifyContent: "center",
  },

  statusText: { fontWeight: "900", fontSize: 12 },

  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 10,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  label: { color: "#9ca3af" },
  value: { color: "#e5e7eb", fontWeight: "700" },

  green: { color: "#7ee0b8", fontWeight: "900" },
  red: { color: "#ff9b9b", fontWeight: "900" },

  runningInfo: { color: "#cbd5e1", fontWeight: "600" },

  filterBtn: { alignSelf: "flex-end", marginBottom: 10 },
  filterText: { color: "#9ca3af" },

  summary: {
    marginTop: 20,
    marginBottom: 60,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#111827",
    alignItems: "center",
  },

  summaryText: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 15,
    marginVertical: 4,
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  menu: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    width: 220,
  },

  menuItem: {
    color: "#e5e7eb",
    paddingVertical: 10,
    fontWeight: "700",
  },
});
