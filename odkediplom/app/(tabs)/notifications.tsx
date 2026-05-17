import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/contexts/AppContext';

export default function NotificationScreen() {
  const { token } = useApp() as any;
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Функцийг useCallback дотор хийснээр setInterval-д ашиглахад аюулгүй болно
  const fetchNotifications = useCallback(async (isBackground = false) => {
    if (!token) return;
    try {
      // Хэрэв арын фон дээр шалгаж байгаа бол 'Loading' индикатор харуулахгүй
      if (!isBackground) setRefreshing(true);
      
      const res = await axios.get('http://192.168.144.53:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Зөвхөн өөрчлөлт орсон үед state-г шинэчлэх (заавал биш ч хийвэл сайн)
      setNotifications(res.data);
    } catch (e) {
      console.log("Мэдээлэл татахад алдаа:", e);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    // 1. Анх дэлгэц нээгдэхэд ажиллана
    fetchNotifications();

    // 2. РЕАЛ-ТАЙМ: 5 секунд тутамд баазад шинэ мэдэгдэл байгааг шалгана
    const intervalId = setInterval(() => {
      fetchNotifications(true); // true гэдэг нь чимээгүй (background) шалгахыг хэлнэ
    }, 5000); 

    // Дэлгэцнээс гарахад интервалыг зогсооно (санах ойг цэвэрлэх)
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await axios.post(`http://192.168.144.53:8000/api/notifications/${id}/mark_as_read/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications(true); // Чимээгүй шинэчлэх
    } catch (e) {
      console.log(e);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.card, !item.is_read && styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={item.title.includes('⚠️') ? "alert-circle" : "notifications"} 
          size={24} 
          color={item.is_read ? "#94A3B8" : "#4F46E5"} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.is_read && styles.unreadText]}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{item.created_at_human || new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.is_read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Мэдэгдэл</Text>
        {/* Уншаагүй мэдэгдлийн тоог харуулж болно */}
        {notifications.filter((n: any) => !n.is_read).length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{notifications.filter((n: any) => !n.is_read).length}</Text></View>
        )}
      </View>
      
      <FlatList
        data={notifications}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications()} />}
        ListEmptyComponent={<Text style={styles.empty}>Мэдэгдэл байхгүй байна.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 50, marginBottom: 20 },
  header: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  badge: { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 10 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  card: { 
    flexDirection: 'row', backgroundColor: '#FFF', padding: 16, borderRadius: 16, 
    marginBottom: 12, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3
  },
  unreadCard: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF' },
  iconContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#475569' },
  unreadText: { color: '#1E293B', fontWeight: '700' },
  message: { fontSize: 14, color: '#64748B', marginTop: 2 },
  date: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});