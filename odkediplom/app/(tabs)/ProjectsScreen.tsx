import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "expo-router";
import { 
  Plus, 
  MoreVertical, 
  ChevronLeft, 
  Search, 
  Users, 
  Clock, 
  LayoutGrid,
  CalendarDays
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function ProjectsScreen() {
  const { token, user, projects, setProjects } = useApp() as any;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('http://192.168.144.53:8000/api/tasks/projects/', { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const filteredProjects = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];
    
    let list = user?.role === 'admin' 
      ? projects 
      : projects.filter((p: any) => {
          const userId = String(user?.id);
          const isOwner = String(p.owner) === userId;
          const isMember = p.members?.some((m: any) => 
            (typeof m === 'object' ? String(m.id) : String(m)) === userId
          );
          return isOwner || isMember;
        });

    if (activeTab === "In Progress") return list.filter((p: any) => (p.progress || 0) < 100);
    if (activeTab === "Finished") return list.filter((p: any) => (p.progress || 0) === 100);
    return list;
  }, [projects, user, activeTab]);

  const renderProjectCard = (project: any) => {
    const progress = project.progress || 0;
    const memberCount = project.members?.length || 0;
    const isCompleted = progress === 100;

    return (
      <TouchableOpacity 
        key={project.id} 
        style={styles.projectCard}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: "/ProjectDetailScreen", params: { id: project.id } } as any)}
      >
        <View style={styles.cardTop}>
          <View style={[styles.categoryBadge, { backgroundColor: isCompleted ? '#DCFCE7' : '#EEF2FF' }]}>
             <Text style={[styles.categoryText, { color: isCompleted ? '#166534' : '#4338CA' }]}>
               {isCompleted ? 'Дууссан' : 'Хийгдэж буй'}
             </Text>
          </View>
          <TouchableOpacity hitSlop={10}>
            <MoreVertical size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.projectTitle} numberOfLines={1}>{project.name}</Text>
        <Text style={styles.projectSubText} numberOfLines={2}>
          {project.description || "Төслийн дэлгэрэнгүй тайлбар байхгүй байна."}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Users size={14} color="#64748B" />
            <Text style={styles.footerText}>{memberCount}</Text>
          </View>
          <View style={styles.footerItem}>
            <CalendarDays size={14} color="#64748B" />
            <Text style={styles.footerText}>12.30</Text> 
          </View>
        </View>

        <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
                <LinearGradient
                    colors={isCompleted ? ['#10B981', '#34D399'] : ['#4338CA', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                />
            </View>
            <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        {/* Navigation Header */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronLeft size={22} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Төслүүд</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Search size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4338CA" />}
        >
          {/* Hero Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>{user?.first_name || "Хэрэглэгч"}</Text>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.mainTitle}>Миний</Text>
                <Text style={styles.subTitle}>Төсөл хөтөлбөрүүд</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{filteredProjects.length}</Text>
              </View>
            </View>
          </View>

          {/* Custom Tabs */}
          <View style={styles.tabsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                {["All", "In Progress", "Finished"].map((t) => (
                    <TouchableOpacity 
                    key={t} 
                    onPress={() => setActiveTab(t)}
                    style={[styles.tab, activeTab === t && styles.tabActive]}
                    >
                    <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                        {t === "All" ? "Бүх төсөл" : t === "In Progress" ? "Хийгдэж буй" : "Дууссан"}
                    </Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#4338CA" />
            </View>
          ) : filteredProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <LayoutGrid size={48} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyText}>Одоогоор төсөл байхгүй байна</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              <View style={styles.col}>
                {filteredProjects.filter((_, i) => i % 2 === 0).map(renderProjectCard)}
              </View>
              <View style={styles.col}>
                {filteredProjects.filter((_, i) => i % 2 !== 0).map(renderProjectCard)}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <TouchableOpacity 
            style={styles.fab} 
            activeOpacity={0.8}
            onPress={() => router.push("/CreateProjectScreen")}
          >
            <LinearGradient colors={['#4338CA', '#6366F1']} style={styles.fabGradient}>
              <Plus size={28} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  topNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    backgroundColor: '#F8FAFC'
  },
  navTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  iconBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: 24, marginTop: 10, marginBottom: 20 },
  greeting: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainTitle: { fontSize: 26, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  subTitle: { fontSize: 20, fontWeight: '400', color: '#4338CA', marginTop: -4 },
  countBadge: { backgroundColor: '#1E293B', width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  
  tabsWrapper: { marginBottom: 20 },
  tabsScroll: { paddingHorizontal: 20, gap: 10 },
  tab: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 14, 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  tabActive: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  tabText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#FFF' },
  
  grid: { flexDirection: 'row', paddingHorizontal: 20, gap: 14 },
  col: { flex: 1, gap: 14 },
  projectCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    ...Platform.select({
        ios: { shadowColor: "#1E293B", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
        android: { elevation: 3 }
    })
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  projectTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  projectSubText: { fontSize: 12, color: '#94A3B8', marginBottom: 15, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressPercent: { fontSize: 10, fontWeight: '800', color: '#1E293B', width: 28 },
  
  center: { paddingVertical: 100, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 30, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  
  fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 20, shadowColor: '#4338CA', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  fabGradient: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }
});