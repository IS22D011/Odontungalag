import React, { useMemo, useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import { ChevronLeft, CheckCircle2, Clock, Layout } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function MemberTasksScreen() {
  const { userId, projectId, userName } = useLocalSearchParams();
  const { tasks, projects, users, token, fetchTasks } = useApp() as any;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // 1. БОДИТ ХУГАЦААНЫ СИНХРОНЧЛОЛ (3 секунд тутамд)
  useEffect(() => {
    if (!token) return;
    
    // Эхний удаа дата татах
    fetchTasks(token); 

    const interval = setInterval(() => {
      fetchTasks(token);
    }, 3000);

    return () => clearInterval(interval);
  }, [token, fetchTasks]);

  // Гар аргаар шинэчлэх
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (token) await fetchTasks(token);
    setRefreshing(false);
  }, [token, fetchTasks]);

  // Сонгогдсон хэрэглэгчийн мэдээллийг олох
  const member = useMemo(() => {
    return users?.find((u: any) => String(u.id) === String(userId));
  }, [users, userId]);

  // Сонгогдсон төслийн мэдээллийг олох
  const currentProject = useMemo(() => {
    return projects?.find((p: any) => String(p.id) === String(projectId));
  }, [projects, projectId]);

  // Тухайн төсөл дээрх тухайн ажилтны даалгавруудыг шүүх
  const memberProjectTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks.filter((t: any) => {
      const tProjId = t.project?.id || t.project_id || t.project;
      const isCorrectProject = String(tProjId) === String(projectId);
      
      const assigned = t.assigned_to;
      let isAssigned = false;
      
      if (Array.isArray(assigned)) {
        isAssigned = assigned.some(userObj => String(userObj?.id || userObj) === String(userId));
      } else {
        const assignedId = assigned?.id || assigned;
        isAssigned = String(assignedId) === String(userId);
      }
      
      return isCorrectProject && isAssigned;
    });
  }, [tasks, userId, projectId]);

  // Гүйцэтгэлийн хувийг тооцоолох
  const personalProgress = useMemo(() => {
    if (memberProjectTasks.length === 0) return 0;
    const completed = memberProjectTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / memberProjectTasks.length) * 100);
  }, [memberProjectTasks]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ажилтны явц</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#4F46E5" 
          />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(member?.first_name || userName || "U")[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{member?.first_name || userName || "Хэрэглэгч"}</Text>
          <View style={styles.projectBadge}>
            <Layout size={14} color="#4F46E5" />
            <Text style={styles.projectBadgeText}>{currentProject?.name || "Төсөл"}</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <View>
              <Text style={styles.progressTitle}>Хувийн гүйцэтгэл</Text>
              <Text style={styles.progressSubtext}>Төсөл дэх нийт оролцоо</Text>
            </View>
            <Text style={styles.progressPercent}>{personalProgress}%</Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${personalProgress}%` }]} />
          </View>

          <View style={styles.taskStats}>
              <View style={styles.statLine}>
                <View style={[styles.dot, {backgroundColor: '#10B981'}]} />
                <Text style={styles.statText}>
                  Дууссан: {memberProjectTasks.filter(t => t.status === 'done').length}
                </Text>
              </View>
              <View style={styles.statLine}>
                <View style={[styles.dot, {backgroundColor: '#F59E0B'}]} />
                <Text style={styles.statText}>
                  Хүлээгдэж буй: {memberProjectTasks.filter(t => t.status !== 'done').length}
                </Text>
              </View>
          </View>
        </View>

        {/* Task List */}
        <Text style={styles.sectionTitle}>
          Хариуцсан даалгаврууд ({memberProjectTasks.length})
        </Text>
        
        <View style={styles.taskList}>
          {memberProjectTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Одоогоор даалгавар оноогоогүй байна.</Text>
            </View>
          ) : (
            memberProjectTasks.map((task: any) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskContent}>
                  {task.status === 'done' ? (
                    <CheckCircle2 size={22} color="#10B981" />
                  ) : (
                    <Clock size={22} color="#F59E0B" />
                  )}
                  <View style={styles.taskTexts}>
                    <Text 
                      style={[styles.taskTitle, task.status === 'done' && styles.taskDone]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <Text style={styles.taskDeadline}>
                      Хугацаа: {task.due_date || "Заагаагүй"}
                    </Text>
                  </View>
                </View>
                
                <View style={[
                  styles.statusTag, 
                  { backgroundColor: task.status === 'done' ? '#D1FAE5' : '#FEF3C7' }
                ]}>
                  <Text style={[
                    styles.statusTagText, 
                    { color: task.status === 'done' ? '#065F46' : '#92400E' }
                  ]}>
                    {task.status === 'done' ? 'Дууссан' : 'Явц'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDFDFD" },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    paddingTop: Platform.OS === 'android' ? 40 : 10 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
  profileSection: { alignItems: 'center', marginVertical: 20 },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 28, 
    backgroundColor: '#1E1B4B', 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  userName: { fontSize: 22, fontWeight: '700', marginTop: 12, color: '#111827' },
  projectBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10, 
    marginTop: 10 
  },
  projectBadgeText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
  progressCard: { 
    margin: 20, 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 15 
  },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  progressSubtext: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  progressPercent: { fontSize: 24, fontWeight: '900', color: '#4F46E5' },
  progressBarBg: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 5 },
  taskStats: { flexDirection: 'row', gap: 20, marginTop: 15 },
  statLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginHorizontal: 20, marginTop: 10, marginBottom: 15, color: '#111827' },
  taskList: { paddingHorizontal: 20 },
  taskItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5
  },
  taskContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  taskTexts: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  taskDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskDeadline: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' }
});