import { useApp } from "@/contexts/AppContext";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle2,
  Clock,
  History,
  MapPin,
} from "lucide-react-native";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const {
    user,
    tasks,
    isCheckedIn,
    checkIn,
    checkOut,
    todayAttendance,
    stats,
  } = useApp();

  const myTasks = useMemo(() => {
    return tasks
      .filter((task) => task.assignedTo.includes(user.id))
      .filter((task) => task.status !== "done")
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 3);
  }, [tasks, user.id]);

  const handleCheckInOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isCheckedIn) {
      await checkOut();
    } else {
      router.push("/attendance-method");
    }
  };

  const handleViewHistory = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/attendance-history");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Өглөөний мэнд";
    if (hour < 18) return "Өдрийн мэнд";
    return "Оройн мэнд";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "#EF4444";
      case "high":
        return "#F97316";
      case "medium":
        return "#3B82F6";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4F46E5", "#7C3AED"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user.name.split(" ")[0]}</Text>
          </View>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </View>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#E0E7FF" />
          <Text style={styles.dateText}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.checkInCard}>
          <TouchableOpacity
            style={[
              styles.checkInButton,
              isCheckedIn && styles.checkInButtonActive,
            ]}
            onPress={handleCheckInOut}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isCheckedIn ? ["#10B981", "#059669"] : ["#4F46E5", "#7C3AED"]
              }
              style={styles.checkInGradient}
            >
              <View style={styles.checkInIcon}>
                {isCheckedIn ? (
                  <CheckCircle2 size={32} color="#FFFFFF" strokeWidth={2.5} />
                ) : (
                  <MapPin size={32} color="#FFFFFF" strokeWidth={2.5} />
                )}
              </View>
              <Text style={styles.checkInButtonText}>
                {isCheckedIn ? "Гарах" : "Ирц бүртгүүлэх"}
              </Text>
              {todayAttendance?.checkIn && (
                <Text style={styles.checkInTime}>
                  {format(todayAttendance.checkIn, "HH:mm")}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {todayAttendance && (
            <TouchableOpacity
              style={styles.historyButton}
              onPress={handleViewHistory}
              activeOpacity={0.7}
            >
              <History size={20} color="#6B7280" strokeWidth={2} />
              <Text style={styles.historyButtonText}>Ирцийн түүх харах</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#DBEAFE" }]}
            >
              <CheckCircle2 size={20} color="#3B82F6" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stats.presentDays}</Text>
            <Text style={styles.statLabel}>Ирсэн өдөр</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#FEF3C7" }]}
            >
              <Clock size={20} color="#F59E0B" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stats.lateDays}</Text>
            <Text style={styles.statLabel}>Хоцорсон өдөр</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#D1FAE5" }]}
            >
              <Calendar size={20} color="#10B981" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>
              {stats.totalLeaveDays - stats.usedLeaveDays}
            </Text>
            <Text style={styles.statLabel}>Чөлөөний үлдэгдэл</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Өнөөдрийн чухал даалгавар</Text>
          {myTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle2 size={48} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyStateText}>Даалгавар байхгүй байна</Text>
            </View>
          ) : (
            myTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor: getPriorityColor(task.priority) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(task.priority) },
                      ]}
                    >
                      {task.priority === "urgent"
                        ? "ЯАРАЛТАЙ"
                        : task.priority === "high"
                          ? "ӨНДӨР"
                          : task.priority === "medium"
                            ? "ДУНД"
                            : "БАГА"}
                    </Text>
                  </View>
                  <View style={styles.taskMeta}>
                    <Clock size={14} color="#9CA3AF" />
                    <Text style={styles.taskDueDate}>
                      {format(task.dueDate, "MMM d")}
                    </Text>
                  </View>
                </View>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {task.description}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: "#E0E7FF",
    fontWeight: "500" as const,
  },
  userName: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "700" as const,
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#E0E7FF",
    fontWeight: "500" as const,
  },
  content: {
    flex: 1,
  },
  checkInCard: {
    paddingHorizontal: 20,
    marginTop: -40,
    marginBottom: 24,
  },
  checkInButton: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  checkInButtonActive: {
    elevation: 8,
  },
  checkInGradient: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInIcon: {
    marginBottom: 12,
  },
  checkInButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  checkInTime: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500" as const,
    marginTop: 8,
    opacity: 0.9,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  historyButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600" as const,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500" as const,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDueDate: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500" as const,
    marginTop: 12,
  },
});
