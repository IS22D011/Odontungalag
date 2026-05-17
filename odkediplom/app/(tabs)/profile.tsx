import React, { useEffect } from "react";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity,
  View, Alert, Dimensions, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell, Briefcase, Building2, Calendar, CheckCircle2,
  ChevronRight, Clock, LogOut, Mail, User as UserIcon,
  Shield, TrendingUp, FileText // FileText икон нэмэв
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user, stats, logout } = useApp() as any;
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/(auth)/login");
  }, [user]);

  const handlePress = async (label: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (label) {
      case "Профайл засах":
        router.push("/(tabs)/editProfile");
        break;
      case "Мэдэгдэл":
        router.push("/notifications");
        break;
      case "Чөлөө авах": // Шинэ логик
        router.push("/CreateLeaveScreen"); // Чөлөө авах хуудасны path-аа энд бичнэ үү
        break;
      case "Гарах":
        if (Platform.OS === "web") {
          if (window.confirm("Та системээс гарахдаа итгэлтэй байна уу?")) {
            await logout();
            router.replace("/(auth)/login");
          }
        } else {
          Alert.alert("Системээс гарах", "Та итгэлтэй байна уу?", [
            { text: "Үгүй", style: "cancel" },
            {
              text: "Тийм", style: "destructive",
              onPress: async () => {
                try { await logout(); router.replace("/(auth)/login"); }
                catch (e) { Alert.alert("Алдаа", "Системээс гарахад алдаа гарлаа."); }
              },
            },
          ]);
        }
        break;
    }
  };

  const settingsOptions = [
    { icon: Bell, label: "Мэдэгдэл", color: "#F59E0B", bg: "#FFFBEB", desc: "Шинэ мэдэгдлүүд" },
    { icon: FileText, label: "Чөлөө авах", color: "#10B981", bg: "#ECFDF5", desc: "Чөлөөний хүсэлт илгээх" }, // Шинэ цэс
    { icon: UserIcon, label: "Профайл засах", color: "#6366F1", bg: "#EEF2FF", desc: "Мэдээлэл шинэчлэх" },
    { icon: LogOut, label: "Гарах", color: "#EF4444", bg: "#FEF2F2", desc: "Системээс гарах" },
  ];

  const statItems = [
    { icon: CheckCircle2, label: "Ирсэн", value: stats?.presentDays || 0, color: "#10B981", bg: "#ECFDF5" },
    { icon: Clock, label: "Хоцорсон", value: stats?.lateDays || 0, color: "#F59E0B", bg: "#FFFBEB" },
    { icon: Calendar, label: "Үлдсэн чөлөө", value: Math.max(0, (stats?.totalLeaveDays || 0) - (stats?.usedLeaveDays || 0)), color: "#6366F1", bg: "#EEF2FF" },
    { icon: TrendingUp, label: "Ашигласан", value: stats?.usedLeaveDays || 0, color: "#EF4444", bg: "#FEF2F2" },
  ];

  if (!user) return null;

  const roleLabel = user.role === "admin" ? "Админ" : user.role === "manager" ? "Менежер" : "Ажилтан";

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* ── HERO HEADER ── */}
      <LinearGradient colors={["#0F0C29", "#302B63", "#24243e"]} style={styles.hero}>
        <View style={styles.deco1} />
        <View style={styles.deco2} />

        <View style={styles.heroContent}>
          <View style={styles.avatarRing}>
            <Image
              source={{ uri: user.avatar || "https://via.placeholder.com/150" }}
              style={styles.avatar}
              contentFit="cover"
              transition={400}
            />
          </View>

          <Text style={styles.heroName}>{user.first_name} {user.last_name}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>

          <View style={styles.rolePill}>
            <Shield size={12} color="#818CF8" />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>{stats?.presentDays || 0}</Text>
            <Text style={styles.heroStatLbl}>Ирсэн</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>{stats?.lateDays || 0}</Text>
            <Text style={styles.heroStatLbl}>Хоцорсон</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatVal}>{Math.max(0, (stats?.totalLeaveDays || 0) - (stats?.usedLeaveDays || 0))}</Text>
            <Text style={styles.heroStatLbl}>Чөлөө</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* ── INFO CARD ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Хувийн мэдээлэл</Text>
          </View>
          {[
            { icon: Briefcase, label: "Албан тушаал", value: roleLabel },
            { icon: Building2, label: "Хэлтэс", value: user.department_name || "Тодорхойгүй" },
            { icon: Mail, label: "Цахим хаяг", value: user.email },
          ].map((item, idx, arr) => (
            <View key={item.label}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <item.icon size={18} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{item.value}</Text>
                </View>
              </View>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ── STATS GRID ── */}
        <Text style={styles.sectionTitle}>Ирцийн статистик</Text>
        <View style={styles.statsGrid}>
          {statItems.map((s, i) => (
            <View key={i} style={[styles.statCard, { borderTopColor: s.color }]}>
              <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                <s.icon size={18} color={s.color} />
              </View>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── SETTINGS ── */}
        <Text style={styles.sectionTitle}>Тохиргоо</Text>
        <View style={styles.card}>
          {settingsOptions.map((opt, idx, arr) => (
            <View key={opt.label}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => handlePress(opt.label)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconWrap, { backgroundColor: opt.bg }]}>
                    <opt.icon size={17} color={opt.color} />
                  </View>
                  <View>
                    <Text style={[styles.settingLabel, opt.label === "Гарах" && { color: "#EF4444" }]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.settingDesc}>{opt.desc}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#CBD5E1" />
              </TouchableOpacity>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },

  /* Hero */
  hero: {
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },
  deco1: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(99,102,241,0.12)", top: -60, right: -60,
  },
  deco2: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(139,92,246,0.1)", bottom: 40, left: -40,
  },
  heroContent: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.25)",
    padding: 3, marginBottom: 14,
    shadowColor: "#6366F1", shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 50 },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.4 },
  heroEmail: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 3, marginBottom: 12 },
  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(99,102,241,0.18)",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(99,102,241,0.3)",
  },
  roleText: { color: "#A5B4FC", fontSize: 12, fontWeight: "700" },
  heroStats: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.06)",
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
    paddingVertical: 18,
  },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroStatVal: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroStatLbl: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2, fontWeight: "500" },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },

  /* Body */
  body: { padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#64748B", marginBottom: 12, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.5 },

  /* Card */
  card: {
    backgroundColor: "#fff", borderRadius: 24, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    marginBottom: 20,
  },
  cardHeader: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },

  /* Info rows */
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  infoIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginRight: 14,
  },
  infoLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "500", marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },

  /* Stats grid */
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 10, marginBottom: 20,
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: "#fff", borderRadius: 20,
    padding: 16, alignItems: "center",
    borderTopWidth: 3,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statVal: { fontSize: 24, fontWeight: "800" },
  statLbl: { fontSize: 11, color: "#94A3B8", marginTop: 3, fontWeight: "500", textAlign: "center" },

  /* Settings */
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  settingIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  settingDesc: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
});