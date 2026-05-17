import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, Modal, TextInput 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, UserMinus, LogOut, Users, UserPlus, X, Search } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';

const BASE_URL = "http://192.168.144.53:8000/api";

export default function GroupDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const { token, user: currentUser } = useApp();
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState<any>(null); 
  
  // Modal & Search states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { 
    if (id) {
      fetchRoomDetails();
      fetchMembers(); 
    }
  }, [id]);

  // Өрөөний ерөнхий мэдээлэл болон админ эрхийг авах
  const fetchRoomDetails = async () => {
    try {
      const res = await fetch(`${BASE_URL}/chat/rooms/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const rooms = await res.json();
        const currentRoom = rooms.find((r: any) => r.id === Number(id));
        setRoomData(currentRoom);
      }
    } catch (e) {
      console.error("Room info error:", e);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/chat/rooms/${id}/members/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) { 
      console.error("Members fetch error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  // Гишүүн нэмэхийн тулд хэрэглэгч хайх
  const handleSearchUsers = async (text: string) => {
    setSearchQuery(text);
    setFetchingUsers(true);
    try {
      const res = await fetch(`${BASE_URL}/chat/users/search/?search=${text}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Группт аль хэдийн байгаа хүмүүсийг хайлтын үр дүнгээс хасах
        const filtered = data.filter((u: any) => !members.some(m => m.id === u.id));
        setAllUsers(filtered);
      }
    } catch (e) { 
      console.error("Search error:", e); 
    } finally { 
      setFetchingUsers(false); 
    }
  };

  const addMember = async (targetId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/chat/rooms/${id}/members/`, {
        method: 'POST',
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ user_id: targetId })
      });
      
      if (res.ok) {
        Alert.alert("Амжилттай", "Гишүүн нэмэгдлээ");
        setIsModalVisible(false);
        setSearchQuery('');
        fetchMembers(); // Жагсаалтыг шинэчлэх
      } else {
        const err = await res.json();
        Alert.alert("Алдаа", err.error || "Алдаа гарлаа");
      }
    } catch (e) { console.error(e); }
  };

  const removeMember = async (targetId: number) => {
    Alert.alert("Хасах", "Энэ гишүүнийг группээс хасах уу?", [
      { text: "Болих", style: "cancel" },
      { text: "Тийм", style: "destructive", onPress: async () => {
        try {
          const res = await fetch(`${BASE_URL}/chat/rooms/${id}/members/`, {
            method: 'DELETE',
            headers: { 
              "Content-Type": "application/json", 
              "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ user_id: targetId })
          });
          if (res.ok) fetchMembers();
        } catch (e) { console.error(e); }
      }}
    ]);
  };

  const handleLeaveGroup = () => {
    Alert.alert("Гарах", "Та энэ группээс гарахдаа итгэлтэй байна уу?", [
      { text: "Болих", style: "cancel" },
      { text: "Гарах", style: "destructive", onPress: async () => {
        const res = await fetch(`${BASE_URL}/chat/rooms/${id}/members/`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) router.replace('/(tabs)/messages');
      }}
    ]);
  };

  // Зөвхөн хасах эрхийг админ эсэхээр шийднэ
  const isAdmin = roomData?.is_admin || false;

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#0084FF" /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#0084FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Групп мэдээлэл</Text>
        {/* Хүн нэмэх товч бүх хүнд ил харагдана */}
        <TouchableOpacity onPress={() => {
          setIsModalVisible(true);
          handleSearchUsers('');
        }}>
          <UserPlus size={24} color="#0084FF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <View style={styles.groupInfoCard}>
              <View style={styles.avatarLarge}><Users size={40} color="#FFF" /></View>
              <Text style={styles.groupName}>{name || "Групп чат"}</Text>
              <Text style={styles.memberCount}>{members.length} гишүүд</Text>
              {isAdmin && <Text style={styles.adminBadge}>Та Админ</Text>}
            </View>

            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveGroup}>
              <LogOut size={20} color="#FF3B30" />
              <Text style={styles.leaveText}>Группээс гарах</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Гишүүдийн жагсаалт</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.memberItem}>
            <View style={styles.memberAvatar}>
              <Text style={styles.avatarText}>{item.first_name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.memberName}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.memberRole}>
                {item.id === currentUser?.id ? 'Та' : (item.role === 'admin' ? 'Админ' : 'Ажилтан')}
              </Text>
            </View>
            
            {/* Зөвхөн админ хүн бусдыг хасах эрхтэй */}
            {isAdmin && item.id !== currentUser?.id && (
              <TouchableOpacity onPress={() => removeMember(item.id)}>
                <UserMinus size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* ГИШҮҮН НЭМЭХ МОДАЛ */}
      <Modal visible={isModalVisible} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#FFF'}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Гишүүн нэмэх</Text>
            <TouchableOpacity onPress={() => {
              setIsModalVisible(false);
              setSearchQuery('');
            }}>
              <X size={28} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchBox}>
            <Search size={18} color="#8E8E93" style={{marginRight: 8}} />
            <TextInput
              style={styles.searchInput}
              placeholder="Нэр эсвэл хэрэглэгчийн нэрээр хайх..."
              value={searchQuery}
              onChangeText={handleSearchUsers}
              autoFocus={true}
            />
          </View>
          
          {fetchingUsers ? (
            <ActivityIndicator size="large" color="#0084FF" style={{marginTop: 50}} />
          ) : (
            <FlatList
              data={allUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.memberItem} onPress={() => addMember(item.id)}>
                  <View style={[styles.memberAvatar, {backgroundColor: '#E7F3FF'}]}>
                    <Text style={{color: '#0084FF', fontWeight: 'bold'}}>{item.first_name?.[0]}</Text>
                  </View>
                  <View style={{flex: 1, marginLeft: 12}}>
                    <Text style={styles.memberName}>{item.first_name} {item.last_name}</Text>
                    <Text style={styles.memberRole}>@{item.username}</Text>
                  </View>
                  <UserPlus size={20} color="#0084FF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Хэрэглэгч олдсонгүй.</Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 16, backgroundColor: '#FFF', borderBottomWidth: 0.5, borderColor: '#EEE'
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  groupInfoCard: { alignItems: 'center', padding: 30, backgroundColor: '#FFF' },
  avatarLarge: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#0084FF', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15 
  },
  groupName: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  memberCount: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  adminBadge: { fontSize: 12, color: '#0084FF', fontWeight: 'bold', marginTop: 5, backgroundColor: '#E7F3FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  leaveBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 15, backgroundColor: '#FFF', marginTop: 10,
    borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#EEE'
  },
  leaveText: { color: '#FF3B30', marginLeft: 10, fontWeight: '600' },
  sectionTitle: { fontSize: 13, color: '#8E8E93', padding: 16, textTransform: 'uppercase', fontWeight: '600' },
  memberItem: { 
    flexDirection: 'row', alignItems: 'center', padding: 15, 
    backgroundColor: '#FFF', borderBottomWidth: 0.5, borderColor: '#EEE' 
  },
  memberAvatar: { 
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F2F5', 
    justifyContent: 'center', alignItems: 'center' 
  },
  avatarText: { fontWeight: 'bold', color: '#444' },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  memberRole: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  modalHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, borderBottomWidth: 1, borderColor: '#EEE' 
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#8E8E93', fontSize: 15 }
});