import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Check, User, Briefcase, ShieldCheck } from 'lucide-react-native';

export default function SelectProjectMembersScreen() {
  const { users, projects, addMembersToProject } = useApp() as any;
  const { projectId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 1. Одоо байгаа төсөл болон түүний гишүүдийг олох
  const project = useMemo(() => 
    projects.find((p: any) => String(p.id) === String(projectId)), 
    [projects, projectId]
  );

  // Төсөлд аль хэдийн байгаа гишүүдийн ID-нууд
  const existingMemberIds = useMemo(() => project?.members || [], [project]);

  // 2. Төсөлд байхгүй хэрэглэгчдийг шүүж харуулах
  const availableUsers = useMemo(() => {
    return users.filter((u: any) => !existingMemberIds.includes(u.id));
  }, [users, existingMemberIds]);

  // 3. Шинээр сонгож буй гишүүдийн ID-нууд
  const [newSelectedIds, setNewSelectedIds] = useState<number[]>([]);

  const toggleMember = (id: number) => {
    if (newSelectedIds.includes(id)) {
      setNewSelectedIds(newSelectedIds.filter(item => item !== id));
    } else {
      setNewSelectedIds([...newSelectedIds, id]);
    }
  };

  const handleSave = async () => {
    if (newSelectedIds.length === 0) {
      Alert.alert("Мэдэгдэл", "Шинэ гишүүн сонгоогүй байна.");
      return;
    }

    setLoading(true);
    // ХУУЧИН ГИШҮҮД + ШИНЭ ГИШҮҮД-ийг нэгтгэж явуулна
    const allMembers = [...existingMemberIds, ...newSelectedIds];
    
    const res = await addMembersToProject(projectId as string, allMembers);
    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert("Алдаа", res.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Шинэ гишүүн нэмэх</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.countInfo}>
        <Text style={styles.countText}>Боломжит ажилчид: {availableUsers.length}</Text>
      </View>

      <FlatList
        data={availableUsers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Бүх ажилчид энэ төсөлд орсон байна.</Text>}
        renderItem={({ item }) => {
          const isSelected = newSelectedIds.includes(item.id);
          return (
            <TouchableOpacity 
              style={[styles.userCard, isSelected && styles.selectedCard]} 
              onPress={() => toggleMember(item.id)}
            >
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <User size={20} color="#6B7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.first_name || item.username}</Text>
                  
                  {/* ROLE болон DEPARTMENT харуулах хэсэг */}
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <ShieldCheck size={12} color="#4F46E5" />
                      <Text style={styles.badgeText}>{item.role || 'Ажилтан'}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
                      <Briefcase size={12} color="#6B7280" />
                      <Text style={[styles.badgeText, { color: '#6B7280' }]}>
                        {item.department_name || 'Хэлтэсгүй'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                {isSelected && <Check size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              Сонгосон {newSelectedIds.length} гишүүнийг нэмэх
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 8 },
  countInfo: { paddingHorizontal: 20, paddingTop: 10 },
  countText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  userCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 16, backgroundColor: '#F9FAFB', marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  selectedCard: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#4F46E5', textTransform: 'capitalize' },
  checkbox: { width: 22, height: 22, borderRadius: 8, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#fff' },
  saveBtn: { backgroundColor: '#111827', padding: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' }
});