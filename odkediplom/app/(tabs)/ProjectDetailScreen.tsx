import React, { useMemo, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Platform, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft, MoreVertical, Calendar, CheckCircle2,
  Circle, Plus, UserPlus, Building2, Users, Layers,
} from "lucide-react-native";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { projects, setProjects, tasks, setTasks, users, token, user } = useApp() as any;
  const [loadingTasks, setLoadingTasks] = useState(false);

  const project = useMemo(() => {
    if (!projects || !id) return null;
    return projects.find((p: any) => String(p.id) === String(id));
  }, [projects, id]);

  const refreshProjectData = async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`http://192.168.144.53:8000/api/tasks/projects/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects((prev: any) => prev.map((p: any) => String(p.id) === String(id) ? updated : p));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!token || !id) return;
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await fetch(`http://192.168.144.53:8000/api/tasks/tasks/?project_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const fetched = Array.isArray(data) ? data : data.results || [];
          setTasks((prev: any[]) => {
            const others = (Array.isArray(prev) ? prev : []).filter(t => {
              const pid = t.project?.id || t.project_id || t.project;
              return String(pid) !== String(id);
            });
            return [...others, ...fetched];
          });
        }
      } catch (e) { console.error(e); }
      finally { setLoadingTasks(false); }
    };
    fetchTasks();
  }, [id, token]);

  const projectTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    return tasks.filter((t: any) => {
      const pid = t.project?.id || t.project_id || t.project;
      return String(pid) === String(id);
    });
  }, [tasks, id]);

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    try {
      const res = await fetch(`http://192.168.144.53:8000/api/tasks/tasks/${taskId}/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev: any) => prev.map((t: any) => t.id === taskId ? updated : t));
        await refreshProjectData();
      }
    } catch (e) { Alert.alert("Алдаа", "Холболт амжилтгүй боллоо."); }
  };

  if (!project) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Ачаалж байна...</Text>
      </View>
    );
  }

  const rawMembers = project.members_details || project.members || [];
  const progress = project.progress || 0;
  const doneCount = projectTasks.filter((t: any) => t.status === "done").length;
  const totalCount = projectTasks.length;

  const progressColor = progress === 100 ? ["#10B981", "#34D399"] : ["#6366F1", "#818CF8"];

  return (
    <SafeAreaView style={styles.root}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <ChevronLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Дэлгэрэнгүй</Text>
        <TouchableOpacity style={styles.navBtn}>
          <MoreVertical size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Project hero card */}
        <LinearGradient colors={["#1E1B4B", "#3730A3", "#4338CA"]} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.activeTag}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Идэвхтэй</Text>
            </View>
            <TouchableOpacity style={styles.editChip}>
              <Text style={styles.editChipText}>Засах</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>{project.name}</Text>

          {project.description ? (
            <Text style={styles.heroDesc} numberOfLines={2}>{project.description}</Text>
          ) : null}

          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Calendar size={14} color="#A5B4FC" />
              <Text style={styles.heroMetaText}>
                {project.start_date || "—"} → {project.end_date || "Дуусаагүй"}
              </Text>
            </View>
            {(project.departments_details || []).length > 0 && (
              <View style={styles.heroMetaItem}>
                <Building2 size={14} color="#A5B4FC" />
                <Text style={styles.heroMetaText}>
                  {project.departments_details.map((d: any) => d.name).join(", ")}
                </Text>
              </View>
            )}
          </View>

          {/* Progress */}
          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Гүйцэтгэл</Text>
              <Text style={styles.progressPct}>{progress}%</Text>
            </View>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={progressColor as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` as any }]}
              />
            </View>
          </View>

          {/* Mini stats */}
          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{doneCount}</Text>
              <Text style={styles.miniStatLbl}>Дууссан</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{totalCount - doneCount}</Text>
              <Text style={styles.miniStatLbl}>Үлдсэн</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{rawMembers.length}</Text>
              <Text style={styles.miniStatLbl}>Гишүүд</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHdr}>
            <View style={styles.sectionTitleRow}>
              <Users size={16} color="#6366F1" />
              <Text style={styles.sectionTitle}>Баг</Text>
            </View>
            <TouchableOpacity><Text style={styles.seeAll}>Бүгд</Text></TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberScroll}>
            {rawMembers.map((m: any, i: number) => {
              const obj = typeof m === "object" ? m : (users?.find((u: any) => String(u.id) === String(m)));
              const name = obj?.first_name || obj?.username || "?";
              const userId = obj?.id || m;
              return (
                <TouchableOpacity
                  key={i} style={styles.memberItem}
                  onPress={() => router.push({ pathname: "/MemberTasksScreen", params: { userId, projectId: id, userName: name } })}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>{name[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>{name}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.memberItem}
              onPress={() => router.push({ pathname: "/SelectProjectMembersScreen", params: { projectId: id } })}
            >
              <View style={styles.addMemberCircle}>
                <UserPlus size={20} color="#6366F1" />
              </View>
              <Text style={styles.addMemberText}>Нэмэх</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHdr}>
            <View style={styles.sectionTitleRow}>
              <Layers size={16} color="#6366F1" />
              <Text style={styles.sectionTitle}>Даалгаврууд</Text>
            </View>
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{totalCount}</Text>
            </View>
          </View>

          {loadingTasks ? (
            <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
          ) : projectTasks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Одоогоор даалгавар байхгүй байна.</Text>
            </View>
          ) : (
            projectTasks.map((task: any) => {
              const isDone = task.status === "done";
              let workerNames = "Тодорхойгүй";
              if (task.assigned_to_details?.length) {
                workerNames = task.assigned_to_details.map((u: any) => u.first_name || u.username).join(", ");
              } else if (task.assigned_to) {
                const ids = Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to];
                const names = ids.map((tid: any) => {
                  const u = users?.find((uu: any) => String(uu.id) === String(tid));
                  return u ? (u.first_name || u.username) : null;
                }).filter(Boolean);
                if (names.length) workerNames = names.join(", ");
              }
              return (
                <TouchableOpacity
                  key={task.id} style={[styles.taskCard, isDone && styles.taskCardDone]}
                  onPress={() => toggleTaskStatus(task.id, task.status)}
                  activeOpacity={0.8}
                >
                  <View style={styles.taskLeft}>
                    {isDone
                      ? <CheckCircle2 size={22} color="#10B981" />
                      : <Circle size={22} color="#CBD5E1" />
                    }
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskTitle, isDone && styles.taskDone]}>{task.title}</Text>
                      <Text style={styles.taskWorker}>{workerNames}</Text>
                    </View>
                  </View>
                  {task.priority && (
                    <View style={[styles.priorityDot, {
                      backgroundColor:
                        task.priority === "high" || task.priority === "urgent" ? "#EF4444" :
                        task.priority === "medium" ? "#F59E0B" : "#10B981"
                    }]} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {(user?.role === "admin" || user?.role === "manager" || String(project.owner) === String(user?.id)) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push({ pathname: "/CreateTaskScreen", params: { projectId: id } })}
          activeOpacity={0.9}
        >
          <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.fabGradient}>
            <Plus size={22} color="#fff" />
            <Text style={styles.fabText}>Даалгавар нэмэх</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#94A3B8" },

  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  navTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },

  /* Hero card */
  heroCard: {
    margin: 16, borderRadius: 28, padding: 22, overflow: "hidden",
    shadowColor: "#4338CA", shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  activeTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#34D399" },
  activeText: { color: "#A7F3D0", fontSize: 11, fontWeight: "700" },
  editChip: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  editChipText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 8 },
  heroDesc: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 14, lineHeight: 19 },
  heroMeta: { gap: 6, marginBottom: 20 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  heroMetaText: { color: "#A5B4FC", fontSize: 12, fontWeight: "500" },

  progressWrap: { marginBottom: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" },
  progressPct: { color: "#fff", fontSize: 13, fontWeight: "800" },
  progressBg: { height: 8, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 6, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 6 },

  miniStats: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 16, paddingVertical: 14 },
  miniStat: { flex: 1, alignItems: "center" },
  miniStatVal: { fontSize: 20, fontWeight: "800", color: "#fff" },
  miniStatLbl: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2, fontWeight: "500" },
  miniStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },

  /* Section */
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  seeAll: { color: "#6366F1", fontWeight: "600", fontSize: 13 },
  countChip: { backgroundColor: "#EEF2FF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  countChipText: { color: "#6366F1", fontSize: 12, fontWeight: "700" },

  /* Members */
  memberScroll: { paddingRight: 16, gap: 16 },
  memberItem: { alignItems: "center", width: 58 },
  memberAvatar: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#E0E7FF",
    shadowColor: "#6366F1", shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  memberInitial: { fontWeight: "800", color: "#6366F1", fontSize: 17 },
  memberName: { marginTop: 7, fontSize: 10, color: "#64748B", fontWeight: "600", textAlign: "center" },
  addMemberCircle: {
    width: 52, height: 52, borderRadius: 18,
    borderWidth: 1.5, borderColor: "#CBD5E1", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  addMemberText: { marginTop: 7, fontSize: 10, color: "#6366F1", fontWeight: "700", textAlign: "center" },

  /* Tasks */
  taskCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", padding: 16, borderRadius: 18, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
    borderLeftWidth: 3, borderLeftColor: "#E2E8F0",
  },
  taskCardDone: { borderLeftColor: "#10B981", opacity: 0.75 },
  taskLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  taskDone: { textDecorationLine: "line-through", color: "#94A3B8" },
  taskWorker: { fontSize: 12, color: "#94A3B8", fontWeight: "500" },
  priorityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },

  emptyBox: { backgroundColor: "#fff", borderRadius: 18, padding: 30, alignItems: "center" },
  emptyText: { color: "#94A3B8", fontSize: 13, fontWeight: "500" },

  fab: {
    position: "absolute", bottom: 28, alignSelf: "center",
    borderRadius: 20,
    shadowColor: "#6366F1", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  fabGradient: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 15, borderRadius: 20,
  },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
