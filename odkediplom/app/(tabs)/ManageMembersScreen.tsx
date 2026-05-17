import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList, // FlatList-ийг SectionList-ээр солив
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';

const BASE_URL = "http://192.168.144.53:8000";

export default function ManageMembersScreen() {
  const { token } = useApp();
  const [members, setMembers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showDeptModal, setShowDeptModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memRes, deptRes] = await Promise.all([
        fetch(`${BASE_URL}/api/organizations/members/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/api/organizations/departments/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const memData = await memRes.json();
      const deptData = await deptRes.json();

      if (memRes.ok) setMembers(memData);
      if (deptRes.ok) setDepartments(deptData);
    } catch (error) {
      Alert.alert('Алдаа', 'Мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  //Role-ийг монгол болгох функц
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'manager': return 'Менежер';
      case 'employee': return 'Ажилтан';
      default: return 'Ажилтан';
    }
  };

  // Гишүүдийг хэлтэс хэлтсээр нь бүлэглэх (Memoized)
  const groupedMembers = useMemo(() => {
    const groups: { [key: string]: any } = {
      'Хэлтэсгүй': { title: 'Хэлтэсгүй', data: [] }
    };

    // Эхлээд хэлтсүүдийг бэлдэх
    departments.forEach(dept => {
      groups[dept.name] = { title: dept.name, data: [] };
    });

    // Гишүүдийг ангилах
    members.forEach(member => {
      const deptName = member.department_name || 'Хэлтэсгүй';
      if (groups[deptName]) {
        groups[deptName].data.push(member);
      } else {
        // Хэрэв дата бааз дээр хэлтэстэй мөртлөө departments жагсаалтад байхгүй бол
        if (!groups[deptName]) groups[deptName] = { title: deptName, data: [] };
        groups[deptName].data.push(member);
      }
    });

    // Хоосон хэлтсүүдийг харуулахгүй байх эсвэл харуулахыг энд шийднэ
    return Object.values(groups).filter((g: any) => g.data.length > 0);
  }, [members, departments]);

const removeMember = (id: number, name: string) => {
  const performDelete = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/organizations/members/${id}/`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== id));
        // Вэб дээр alert ажилладаг болгох
        if (Platform.OS === 'web') {
          window.alert('Амжилттай: Ажилтныг хаслаа.');
        } else {
          Alert.alert('Амжилттай', 'Ажилтныг хаслаа.');
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Баталгаажуулах хэсэг (Вэб болон Mobile-д тохируулсан)
  if (Platform.OS === 'web') {
    if (window.confirm(`${name}-г байгууллагаас хасах уу?`)) {
      performDelete();
    }
  } else {
    Alert.alert(
      'Баталгаажуулалт',
      `${name}-г байгууллагаас хасах уу?`,
      [
        { text: 'Цуцлах', style: 'cancel' },
        { text: 'Хасах', style: 'destructive', onPress: performDelete },
      ]
    );
  }
};

  const updateMemberDepartment = async (deptId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/api/organizations/members/${selectedMember.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ department: deptId }),
      });

      if (res.ok) {
        setShowDeptModal(false);
        fetchData(); 
      }
    } catch (error) {
      Alert.alert('Алдаа', 'Хэлтэс солиход алдаа гарлаа');
    }
  };

  const renderMemberItem = ({ item }: { item: any }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.user.first_name ? item.user.first_name[0] : 'U'}</Text>
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.memberName}>{item.user.first_name} {item.user.last_name}</Text>
          <View style={styles.roleContainer}>
            <Ionicons name="person-circle-outline" size={14} color="#64748b" />
            <Text style={styles.memberRole}>{getRoleLabel(item.role)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => { setSelectedMember(item); setShowDeptModal(true); }}
          style={styles.actionBtn}
        >
          <Ionicons name="business-outline" size={18} color="#4f46e5" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => removeMember(item.id, item.user.first_name)}
          style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Гишүүдийн удирдлага</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
      ) : (
        <SectionList
          sections={groupedMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMemberItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <View style={styles.sectionLine} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Хэлтэс сонгох Modal */}
      <Modal visible={showDeptModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Хэлтэс оноох</Text>
            <Text style={styles.modalSubTitle}>{selectedMember?.user.first_name}-д хэлтэс сонгоно уу</Text>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {departments.map((dept) => (
                <TouchableOpacity 
                  key={dept.id} 
                  style={styles.deptOption}
                  onPress={() => updateMemberDepartment(dept.id)}
                >
                  <Ionicons name="chevron-forward-circle-outline" size={20} color="#4f46e5" />
                  <Text style={styles.deptOptionText}>{dept.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={() => setShowDeptModal(false)} style={styles.closeBtn}>
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Цуцлах</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 20, color: '#1e293b' },
  
  // Section Header Styles
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 20, 
    marginBottom: 10,
    backgroundColor: '#f8fafc' 
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0', marginLeft: 10 },

  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  memberInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: '#fff' },
  memberName: { fontSize: 15, fontWeight: '700', color: '#334155' },
  roleContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  memberRole: { fontSize: 12, color: '#64748b' },
  
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', color: '#1e293b' },
  modalSubTitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  deptOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    marginBottom: 8,
    gap: 10
  },
  deptOptionText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  closeBtn: { marginTop: 15, padding: 10, alignItems: 'center' }
});