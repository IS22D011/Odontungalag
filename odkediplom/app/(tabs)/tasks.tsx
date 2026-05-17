import React, { useState, useMemo, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Alert,
  StatusBar
} from "react-native";
import { useRouter, Stack } from "expo-router"; 
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Clock, 
  Plus, 
  Briefcase, 
  ChevronRight,
  Layers,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  ArrowLeft,
  ClipboardList // Шинэ icon
} from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";
import { TaskStatus } from "@/types";

export default function TasksScreen() {
  const { tasks, setTasks, user, token, moveTask, fetchTasks } = useApp() as any;
  const [selectedColumn, setSelectedColumn] = useState<TaskStatus>("todo");
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [reviewText, setReviewText] = useState("");
  
  const router = useRouter();
  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  useFocusEffect(
    useCallback(() => {
      if (token) fetchTasks(token);
    }, [token])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (token) await fetchTasks(token);
    setRefreshing(false);
  }, [token, fetchTasks]);

  const visibleTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return tasks.filter((task: any) => {
      if (!task.assigned_to) return false;
      const assignedIds = Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to];
      return assignedIds.some((id: any) => {
        const targetId = typeof id === 'object' ? id.id : id;
        return Number(targetId) === Number(user?.id);
      });
    });
  }, [tasks, user?.id]);

  const getTasksByStatus = (status: TaskStatus) => {
    return visibleTasks.filter((task: any) => task.status === status);
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus, review?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTasks((prev: any) => prev.map((t: any) => t.id === taskId ? { ...t, status: newStatus, review: review || t.review } : t));
    try {
      await moveTask(taskId, newStatus, review);
      setReviewModalVisible(false);
      setReviewText("");
    } catch (err) {
      if (token) fetchTasks(token);
      Alert.alert("Алдаа", "Хүсэлт амжилтгүй");
    }
  };

  const handleTaskAction = (task: any) => {
    if (task.status === "done") {
      setCurrentTask(task);
      setReviewModalVisible(true);
    } else {
      const nextStatus = task.status === "todo" ? "doing" : "done";
      updateTaskStatus(task.id, nextStatus);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Section */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={["#1E1B4B", "#312E81", "#4338CA"]} style={styles.header}>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Миний даалгавар</Text>
              <Text style={styles.headerSubtitle}>{visibleTasks.length} нийт даалгавар</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tab-ууд Header-ээс илүү гарч Floating харагдана */}
        <View style={styles.tabOuterContainer}>
          <View style={styles.tabContainer}>
            {(["todo", "doing", "done"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.tab, selectedColumn === status && styles.tabActive]}
                onPress={() => setSelectedColumn(status)}
              >
                <Text style={[styles.tabText, selectedColumn === status && styles.tabTextActive]}>
                  {status === "todo" ? "Хийх" : status === "doing" ? "Явц" : "Дууссан"}
                </Text>
                <View style={[styles.countBadge, selectedColumn === status && styles.countBadgeActive]}>
                  <Text style={[styles.countText, selectedColumn === status && styles.countTextActive]}>
                    {getTasksByStatus(status).length}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
      >
        <View style={styles.columnContent}>
          {getTasksByStatus(selectedColumn).length === 0 ? (
             <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                    <ClipboardList size={40} color="#CBD5E1" />
                </View>
                <Text style={styles.emptyText}>Энэ хэсэгт даалгавар байхгүй байна.</Text>
             </View>
          ) : (
            getTasksByStatus(selectedColumn).map((task: any) => (
              <View key={task.id} style={styles.taskCard}>
                <TouchableOpacity onPress={() => router.push(`/TaskDetailScreen?id=${task.id}`)} activeOpacity={0.7}>
                  <View style={styles.taskHeader}>
                    <View style={styles.projectBadge}>
                      <Layers size={12} color="#6366F1" />
                      <Text style={styles.projectText} numberOfLines={1}>{task.project_name || "Ерөнхий"}</Text>
                    </View>
                    <View style={[styles.priorityTag, { 
                      backgroundColor: task.priority === 'high' ? '#FEF2F2' : task.priority === 'medium' ? '#FFF7ED' : '#F0FDF4' 
                    }]}>
                      <View style={[styles.priorityDot, { 
                        backgroundColor: task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F97316' : '#10B981' 
                      }]} />
                      <Text style={[styles.priorityText, {
                        color: task.priority === 'high' ? '#EF4444' : task.priority === 'medium' ? '#F97316' : '#10B981'
                      }]}>{task.priority?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDescription} numberOfLines={2}>{task.description || "Тайлбар байхгүй..."}</Text>
                </TouchableOpacity>

                <View style={styles.taskFooter}>
                  <View style={styles.taskMeta}>
                    <Clock size={14} color="#94A3B8" />
                    <Text style={styles.taskDueDate}>
                      {task.due_date ? format(new Date(task.due_date), "MMM d") : "Хугацаагүй"}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    {task.status === "done" ? (
                      <>
                        <TouchableOpacity style={[styles.miniBtn, styles.backBtn]} onPress={() => updateTaskStatus(task.id, "doing")}>
                          <RotateCcw size={14} color="#EF4444" />
                          <Text style={styles.backBtnText}>Буцаах</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.miniBtn, styles.reviewBtn]} onPress={() => handleTaskAction(task)}>
                          <MessageSquare size={14} color="#6366F1" />
                          <Text style={styles.reviewBtnText}>Review</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={styles.statusAction} onPress={() => handleTaskAction(task)}>
                        <Text style={styles.statusActionText}>
                          {task.status === 'todo' ? 'Эхлүүлэх' : 'Дуусгах'}
                        </Text>
                        <ChevronRight size={16} color="#6366F1" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB Group */}
      <View style={styles.fabGroup}>
        <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={() => router.push("/ProjectsScreen")}>
          <Briefcase color="#6366F1" size={22} />
        </TouchableOpacity>
        {isAdminOrManager && (
          <TouchableOpacity style={styles.fab} onPress={() => router.push("/CreateTaskScreen")}>
            <LinearGradient colors={["#6366F1", "#4338CA"]} style={styles.fabGradient}>
                <Plus color="#FFF" size={28} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  headerWrapper: {
    zIndex: 10,
  },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingHorizontal: 20, 
    paddingBottom: 70, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35 
  },
  headerNav: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8, marginLeft: -8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  headerTitleWrap: { marginLeft: 15 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  
  tabOuterContainer: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    right: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  tabContainer: { 
    flexDirection: "row", 
    backgroundColor: "#FFF", 
    borderRadius: 20, 
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: "center", 
    justifyContent: 'center',
    paddingVertical: 12, 
    borderRadius: 16, 
    gap: 6
  },
  tabActive: { backgroundColor: "#F5F3FF" },
  tabText: { fontWeight: "700", color: "#94A3B8", fontSize: 13 },
  tabTextActive: { color: "#6366F1" },
  countBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  countBadgeActive: { backgroundColor: '#6366F1' },
  countText: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  countTextActive: { color: '#FFF' },

  content: { flex: 1 },
  columnContent: { padding: 20 },
  taskCard: { 
    backgroundColor: "#FFF", 
    borderRadius: 24, 
    padding: 18, 
    marginBottom: 16, 
    elevation: 4, 
    shadowColor: "#1E293B", 
    shadowOpacity: 0.06, 
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 12 },
  projectBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 5 },
  projectText: { fontSize: 11, fontWeight: "700", color: "#6366F1" },
  
  priorityTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 5 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 10, fontWeight: "800" },

  taskTitle: { fontSize: 17, fontWeight: "700", color: '#0F172A', marginBottom: 6 },
  taskDescription: { color: "#64748B", fontSize: 13, lineHeight: 19, marginBottom: 18 },
  taskFooter: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  taskDueDate: { fontSize: 12, color: "#64748B", fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', gap: 8 },
  miniBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 5 },
  backBtn: { backgroundColor: '#FEF2F2' },
  backBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
  reviewBtn: { backgroundColor: '#EEF2FF' },
  reviewBtnText: { color: '#6366F1', fontSize: 11, fontWeight: '800' },
  statusAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  statusActionText: { fontSize: 12, fontWeight: '800', color: '#6366F1', marginRight: 2 },

  emptyState: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', textAlign: 'center' },

  fabGroup: { position: "absolute", right: 20, bottom: 30, alignItems: 'center', gap: 15 },
  fab: { width: 60, height: 60, borderRadius: 30, elevation: 8, shadowColor: '#4338CA', shadowOpacity: 0.3, shadowRadius: 12 },
  fabGradient: { flex: 1, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  fabSecondary: { backgroundColor: "#FFF", width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
});