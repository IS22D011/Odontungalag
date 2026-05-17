import { useApp } from "@/contexts/AppContext";
import { format, isValid } from "date-fns";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Calendar, CheckCircle2, Clock, MapPin,
  ChevronRight, LogOut, AlertTriangle, Bell,
  HelpCircle, MessageSquare
} from "lucide-react-native";
import React, { useMemo, useState, useCallback } from "react";
import * as ExpoLocation from "expo-location";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity,
  View, RefreshControl, ActivityIndicator, Alert,
  Dimensions, Platform,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

const universalAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const confirmButton = buttons.find(b => b.style === 'destructive' || b.text?.includes("Тийм"));
        if (confirmButton && confirmButton.onPress) confirmButton.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      if (buttons && buttons[0].onPress) buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const context = useApp() as any;

  const user = context?.user;
  const tasks = context?.tasks || [];
  const isCheckedIn = context?.isCheckedIn;
  const checkInWithLocation = context?.checkInWithLocation;
  const todayAttendance = context?.todayAttendance || [];
  const stats = context?.stats;
  const isLoading = context?.isLoading;
  const token = context?.token;
  const notifications = context?.notifications || [];

  const fetchUserData = typeof context?.fetchUserData === 'function' ? context.fetchUserData : null;
  const checkAttendanceStatus = typeof context?.checkAttendanceStatus === 'function' ? context.checkAttendanceStatus : null;
  const fetchStats = typeof context?.fetchStats === 'function' ? context.fetchStats : null;

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        if (checkAttendanceStatus) checkAttendanceStatus(token);
        if (fetchUserData) fetchUserData(token);
        if (fetchStats) fetchStats(token);
      }
    }, [token, checkAttendanceStatus, fetchUserData, fetchStats])
  );

  const unreadCount = useMemo(() => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter((n: any) => !n.is_read).length;
  }, [notifications]);

  const attendanceList = useMemo(() => Array.isArray(todayAttendance) ? todayAttendance : [], [todayAttendance]);
  const todayIn = useMemo(() => attendanceList.find((a: any) => a?.status === "IN"), [attendanceList]);
  const todayOut = useMemo(() => attendanceList.find((a: any) => a?.status === "OUT"), [attendanceList]);

  const isActuallyIn = useMemo(() => {
    if (todayIn && !todayOut) return true;
    return !!(isCheckedIn && !todayOut);
  }, [todayIn, todayOut, isCheckedIn]);

  const checkInTimeStr = useMemo(() => {
    const raw = todayIn?.timestamp || todayIn?.check_in || todayIn?.created_at;
    return raw && isValid(new Date(raw)) ? format(new Date(raw), "HH:mm") : null;
  }, [todayIn]);

  const checkOutTimeStr = useMemo(() => {
    const raw = todayOut?.timestamp || todayOut?.check_in || todayOut?.created_at;
    return raw && isValid(new Date(raw)) ? format(new Date(raw), "HH:mm") : null;
  }, [todayOut]);

  const myTasks = useMemo(() => {
    if (!user?.id || !Array.isArray(tasks)) return [];
    return tasks
      .filter((task: any) => {
        const members = task.assigned_to || task.assignedTo || [];
        return Array.isArray(members) && (members.includes(user.id) || members.some((m: any) => m?.id === user.id));
      })
      .filter((task: any) => task.status !== "done")
      .slice(0, 3);
  }, [tasks, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (token) {
      try {
        if (fetchUserData) await fetchUserData(token);
        if (checkAttendanceStatus) await checkAttendanceStatus(token);
        if (fetchStats) await fetchStats(token);
      } catch (e) { console.error(e); }
    }
    setRefreshing(false);
  }, [token, fetchUserData, checkAttendanceStatus, fetchStats]);

  const handleCheckInOut = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isActuallyIn) {
      universalAlert("Ажлаас гарах", "Та ажлын цагаа дуусгаж гарахдаа итгэлтэй байна уу?", [
        { text: "Үгүй", style: "cancel" },
        {
          text: "Тийм, гарах",
          style: "destructive",
          onPress: async () => {
            try {
              const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
              if (status !== "granted") return;
              const location = await ExpoLocation.getCurrentPositionAsync({});
              if (checkInWithLocation) {
                const result = await checkInWithLocation(
                  { latitude: location.coords.latitude, longitude: location.coords.longitude },
                  "gps", "OUT", ""
                );
                if (result.success) {
                  if (token) {
                    await Promise.all([
                      checkAttendanceStatus ? checkAttendanceStatus(token) : Promise.resolve(),
                      fetchUserData ? fetchUserData(token) : Promise.resolve(),
                      fetchStats ? fetchStats(token) : Promise.resolve()
                    ]);
                  }
                  universalAlert("Амжилттай", "Ажлаас гарсан цаг бүртгэгдлээ.");
                  if (onRefresh) onRefresh();
                }
              }
            } catch (err) {
              console.error(err);
              universalAlert("Алдаа", "Ирц бүртгэхэд алдаа гарлаа.");
            }
          },
        },
      ]);
    } else {
      router.push("/attendance-method");
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HEADER ── */}
        <LinearGradient colors={["#1E1B4B", "#312E81", "#4338CA"]} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greetingText}>Сайн байна уу?</Text>
              <Text style={styles.nameText}>{user?.first_name || "Хэрэглэгч"}</Text>
            </View>

            {/* Avatar + notification icon side-by-side */}
            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={() => router.push("/profile")} 
                activeOpacity={0.85}
                style={styles.avatarContainer}
              >
                <Image source={{ uri: user?.avatar }} style={styles.avatar} contentFit="cover" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => router.push("/notifications")}
                activeOpacity={0.8}
              >
                <Bell size={20} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Check-in card */}
          <TouchableOpacity
            onPress={handleCheckInOut}
            disabled={!!(todayIn && todayOut)}
            style={[styles.checkCard, isActuallyIn && styles.checkCardActive]}
            activeOpacity={0.85}
          >
            <View style={styles.checkCardInner}>
              <View style={[styles.checkIconRing, isActuallyIn ? styles.checkIconRingGreen : styles.checkIconRingBlue]}>
                {isActuallyIn ? <LogOut size={20} color="#fff" /> : <MapPin size={20} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkLabel}>
                  {todayIn && todayOut
                    ? "Өнөөдрийн ирц бүртгэгдсэн"
                    : isActuallyIn
                    ? "Ажлаас тарах"
                    : "Ирц бүртгүүлэх"}
                </Text>
                <View style={styles.checkTimes}>
                  {checkInTimeStr && (
                    <View style={styles.timeChip}>
                      <Text style={styles.timeChipText}>Орсон {checkInTimeStr}</Text>
                    </View>
                  )}
                  {checkOutTimeStr && (
                    <View style={[styles.timeChip, { backgroundColor: "rgba(16,185,129,0.15)" }]}>
                      <Text style={[styles.timeChipText, { color: "#6EE7B7" }]}>Гарсан {checkOutTimeStr}</Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={17} color="rgba(255,255,255,0.6)" />
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          <StatCard value={stats?.presentDays ?? 0} label="Ирсэн" color="#6366F1" bg="#EEF2FF" icon={<CheckCircle2 size={15} color="#6366F1" />} />
          <StatCard value={stats?.lateDays ?? 0} label="Хоцорсон" color="#F59E0B" bg="#FFFBEB" icon={<Clock size={15} color="#F59E0B" />} />
          <StatCard
            value={Math.max(0, (stats?.totalLeaveDays || 0) - (stats?.usedLeaveDays || 0))}
            label="Чөлөө"
            color="#10B981"
            bg="#ECFDF5"
            icon={<Calendar size={15} color="#10B981" />}
          />
        </View>


                {/* ── HELP & SUPPORT SECTION (New) ── */}
        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>Тусламж & Дэмжлэг</Text> */}
          <View style={styles.supportContainer}>
            <TouchableOpacity 
                style={[styles.supportItem, { borderBottomWidth: 0 }]} 
                onPress={() => router.push("/ProjectsScreen")}
                activeOpacity={0.7}
            >
              <View style={[styles.supportIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MessageSquare size={20} color="#10B981" />
              </View>
              <View style={styles.supportInfo}>
                <Text style={styles.supportLabel}>Миний төслүүд</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TASKS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Миний даалгаврууд</Text>
            <TouchableOpacity onPress={() => router.push("/tasks")}>
              <Text style={styles.seeAllText}>Бүгд →</Text>
            </TouchableOpacity>
          </View>

          {myTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Одоогоор даалгавар байхгүй.</Text>
            </View>
          ) : (
            myTasks.map((task: any) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              const isHighPriority = task.priority === "high" || task.priority === "urgent";
              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskCard,
                    isOverdue && styles.taskCardOverdue,
                    !isOverdue && isHighPriority && styles.taskCardHigh,
                  ]}
                  onPress={() =>
                    router.push({ pathname: "/TaskDetailScreen", params: { id: task.id } } as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.taskMetaRow}>
                    <View style={styles.projectBadge}>
                      <Text style={styles.projectBadgeText}>{task.project_name || "Ерөнхий"}</Text>
                    </View>
                    {isOverdue ? (
                      <View style={styles.overdueBadge}>
                        <AlertTriangle size={11} color="#EF4444" />
                        <Text style={styles.overdueBadgeText}>Хоцорсон</Text>
                      </View>
                    ) : isHighPriority ? (
                      <View style={styles.highBadge}>
                        <Text style={styles.highBadgeText}>HIGH</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.taskTitle, isOverdue && { color: "#991B1B" }]}>{task.title}</Text>
                  <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>

                  <View style={styles.taskFooter}>
                    <View style={[styles.taskDueRow, isOverdue && styles.taskDueRowOverdue]}>
                      <Clock size={12} color={isOverdue ? "#EF4444" : "#94A3B8"} />
                      <Text style={[styles.taskDueText, isOverdue && styles.taskDueTextOverdue]}>
                        {task.due_date ? format(new Date(task.due_date), "MMM d") : "Хугацаагүй"}
                      </Text>
                    </View>
                    <View style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>
                        {task.status === "todo" ? "Эхлүүлэх" : "Дуусгах"}
                      </Text>
                      <ChevronRight size={13} color="#6366F1" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>


      </ScrollView>
    </View>
  );
}

const StatCard = ({ value, label, color, bg, icon }: any) => (
  <View style={[statStyles.card, { borderTopColor: color }]}>
    <View style={[statStyles.iconWrap, { backgroundColor: bg }]}>{icon}</View>
    <Text style={[statStyles.value, { color }]}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  value: { fontSize: 20, fontWeight: "800" },
  label: { fontSize: 10, color: "#94A3B8", marginTop: 2, fontWeight: "500" },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 50 },

  /* Header */
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", // Илүү цэгцтэй харагдуулна
    marginBottom: 25 
  },
  headerLeft: { flex: 1 },
  headerRight: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  greetingText: { color: "#A5B4FC", fontSize: 13, fontWeight: "500" },
  nameText: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },

  /* Avatar + notif */
  avatarContainer: { 
    borderWidth: 2, 
    borderColor: "rgba(255,255,255,0.25)", 
    borderRadius: 22,
    padding: 2
  },
  avatar: { width: 40, height: 40, borderRadius: 18, backgroundColor: "#eee" },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#312E81",
    paddingHorizontal: 2
  },
  notifBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },

  /* Check-in card */
  checkCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  checkCardActive: { backgroundColor: "rgba(16,185,129,0.15)", borderColor: "#10B981" },
  checkCardInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  checkIconRing: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkIconRingBlue: { backgroundColor: "#6366F1" },
  checkIconRingGreen: { backgroundColor: "#10B981" },
  checkLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
  checkTimes: { flexDirection: "row", gap: 6, marginTop: 5, flexWrap: "wrap" },
  timeChip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeChipText: { color: "#fff", fontSize: 11, fontWeight: "500" },

  /* Stats */
  statsRow: { flexDirection: "row", gap: 10, padding: 18, paddingBottom: 0 },

  /* Section */
  section: { padding: 18, paddingBottom: 0 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 12 },
  seeAllText: { color: "#6366F1", fontWeight: "600", fontSize: 13 },

  /* Task cards */
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taskCardOverdue: { borderLeftColor: "#EF4444", backgroundColor: "#FFF8F8" },
  taskCardHigh: { borderLeftColor: "#F97316" },
  taskMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  projectBadge: { backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  projectBadgeText: { fontSize: 10, color: "#6366F1", fontWeight: "700" },
  overdueBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF2F2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  overdueBadgeText: { fontSize: 10, color: "#EF4444", fontWeight: "700" },
  highBadge: { backgroundColor: "#FFF7ED", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  highBadgeText: { fontSize: 10, color: "#F97316", fontWeight: "700" },
  taskTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  taskDesc: { fontSize: 12, color: "#64748B", marginBottom: 10 },
  taskFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  taskDueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  taskDueRowOverdue: {},
  taskDueText: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
  taskDueTextOverdue: { color: "#EF4444" },
  actionBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F3FF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, gap: 3 },
  actionBtnText: { fontSize: 11, color: "#6366F1", fontWeight: "700" },

  emptyState: { padding: 30, alignItems: "center", backgroundColor: "#fff", borderRadius: 18 },
  emptyText: { color: "#94A3B8", fontSize: 13, fontWeight: "500" },

  /* Support Section (New) */
  supportContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  supportIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  supportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  supportLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  supportSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
});