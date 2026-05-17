import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView, Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { ChevronLeft, Calendar, Clock, AlignLeft, CheckCircle2, Tag } from "lucide-react-native";
import { format, isValid } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from "expo-status-bar";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { tasks } = useApp() as any;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tasks && id) {
      const foundTask = tasks.find((t: any) => t.id.toString() === id.toString());
      setTask(foundTask);
      setLoading(false);
    }
  }, [id, tasks]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Даалгавар олдсонгүй.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getPriorityInfo = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === 'urgent') return { color: "#EF4444", label: "Яаралтай", bg: "#FEF2F2" };
    if (p === 'high') return { color: "#F97316", label: "Өндөр", bg: "#FFF7ED" };
    if (p === 'medium') return { color: "#6366F1", label: "Дунд", bg: "#EEF2FF" };
    return { color: "#10B981", label: "Нам", bg: "#ECFDF5" };
  };

  const priority = getPriorityInfo(task.priority);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      {/* Header Gradient */}
      <LinearGradient colors={["#1E1B4B", "#312E81"]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Дэлгэрэнгүй</Text>
            <View style={{ width: 40 }} /> 
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Task Main Card */}
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
              <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
              <Text style={[styles.priorityLabel, { color: priority.color }]}>
                {priority.label}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{task.status?.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.title}>{task.title}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.iconBox}>
                <Calendar size={18} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Дуусах хугацаа</Text>
                <Text style={[styles.infoValue, isOverdue && { color: '#EF4444' }]}>
                  {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : 'Хугацаагүй'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Tag size={18} color="#10B981" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Төсөл</Text>
                <Text style={styles.infoValue}>{task.project_name || "Ерөнхий"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlignLeft size={20} color="#1E293B" />
            <Text style={styles.sectionTitle}>Тайлбар</Text>
          </View>
          <View style={styles.descCard}>
            <Text style={styles.description}>
              {task.description || "Энэ даалгаварт дэлгэрэнгүй тайлбар байхгүй байна."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert("Мэдээлэл", "Төлөв шинэчлэх функц удахгүй нэмэгдэнэ.")}
        >
          <LinearGradient
            colors={['#4338CA', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <CheckCircle2 size={20} color="#fff" />
            <Text style={styles.buttonText}>Дууссан гэж тэмдэглэх</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  scrollContent: { padding: 20, marginTop: -30, paddingBottom: 100 },
  
  /* Main Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 20,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  priorityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  priorityLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  statusBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 20, lineHeight: 28 },
  
  infoGrid: { flexDirection: 'row', gap: 15 },
  infoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#EEF2FF', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  infoLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 13, color: '#1E293B', fontWeight: '700' },

  /* Section */
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  descCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  description: { fontSize: 15, color: '#475569', lineHeight: 24 },

  /* Footer */
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20, 
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  actionButton: { borderRadius: 16, overflow: 'hidden', elevation: 3 },
  gradientBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    gap: 10 
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  emptyText: { color: '#64748B', fontSize: 16 },
  backLink: { marginTop: 15 },
  backLinkText: { color: '#6366F1', fontWeight: '700' }
});