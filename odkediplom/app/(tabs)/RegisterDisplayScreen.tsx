import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../../contexts/AppContext';

export default function RegisterDisplayScreen() {
  const { token } = useApp();
  const [loading, setLoading] = useState(false); 
  const [actionLoading, setActionLoading] = useState(false); 
  const [displays, setDisplays] = useState<any[]>([]);
  const [newlyCreated, setNewlyCreated] = useState<{ email: string, password: string } | null>(null);

  const BASE_URL = "http://192.168.144.53:8000/api/users";

  const fetchDisplays = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/displays/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisplays(response.data);
    } catch (error) {
      console.error("Жагсаалт татахад алдаа:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDisplays();
  }, [fetchDisplays]);

  // ШИНЭЭР ДЭЛГЭЦ ҮҮСГЭХ ФУНКЦ
const handleCreate = async () => {
  setNewlyCreated(null);
  setActionLoading(true);
  try {
    const response = await axios.post(
      `${BASE_URL}/create-display/`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // СЕРВЕРЭЭС ИРЖ БУЙ ӨГӨГДЛИЙГ ШАЛГАХ
    if (response.data) {
      setNewlyCreated({
        // Таны серверийн хариунаас хамаарч эдгээр түлхүүр (key) өөр байж магадгүй
        email: response.data.email, 
        password: response.data.password || response.data.new_password 
      });
      fetchDisplays();
    }
  } catch (error: any) {
    console.error("Create Error:", error.response?.data);
    Alert.alert("Алдаа", "Мэдээлэл үүсгэхэд алдаа гарлаа.");
  } finally {
    setActionLoading(false);
  }
};

  const handleReset = async (userId: number) => {
    setNewlyCreated(null);
    setActionLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/reset-display-password/${userId}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.new_password) {
        setNewlyCreated({
          email: response.data.email,
          password: response.data.new_password
        });
      }
    } catch (error: any) {
      Alert.alert("Алдаа", "Нууц үг шинэчлэхэд алдаа гарлаа.");
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Амжилттай", "Санах ой руу хуулагдлаа.");
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.headerTitle}>Дэлгэцийн удирдлага</Text>
        <Text style={styles.headerDesc}>QR дэлгэцүүдийг эндээс удирдана.</Text>

        {/* ШИНЭЭР ҮҮСГЭХ ТОВЧЛУУР */}
        <TouchableOpacity onPress={handleCreate} disabled={actionLoading}>
          <LinearGradient
            colors={['#FF512F', '#DD2476']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createBtn}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.createBtnText}>Шинэ дэлгэц нэмэх</Text>
          </LinearGradient>
        </TouchableOpacity>

        {newlyCreated && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="key-outline" size={20} color="#DD2476" />
              <Text style={styles.resultTitle}>Нэвтрэх мэдээлэл</Text>
              <TouchableOpacity onPress={() => setNewlyCreated(null)}>
                <Ionicons name="close-circle" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.infoRow} onPress={() => copyToClipboard(newlyCreated.email)}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.copyRow}>
                <Text style={styles.value}>{newlyCreated.email}</Text>
                <Ionicons name="copy-outline" size={16} color="#666" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoRow} onPress={() => copyToClipboard(newlyCreated.password)}>
              <Text style={styles.label}>Нууц үг</Text>
              <View style={styles.copyRow}>
                <Text style={[styles.value, {color: '#DD2476'}]}>{newlyCreated.password}</Text>
                <Ionicons name="copy-outline" size={16} color="#DD2476" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.listTitle}>Бүртгэлтэй дэлгэцүүд ({displays.length})</Text>
        
        {loading ? (
          <ActivityIndicator color="#DD2476" style={{ marginTop: 20 }} />
        ) : displays.length === 0 ? (
          <Text style={styles.emptyText}>Дэлгэц олдсонгүй.</Text>
        ) : (
          displays.map((item) => (
            <View key={item.id} style={styles.displayCard}>
              <View style={styles.displayInfo}>
                <View style={styles.iconBg}>
                  <Ionicons name="desktop-outline" size={20} color="#666" />
                </View>
                <View>
                  <Text style={styles.displayEmail}>{item.email}</Text>
                  <Text style={styles.displayStatus}>Төлөв: Идэвхтэй</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                onPress={() => handleReset(item.id)} 
                style={styles.resetIconBtn}
              >
                <Ionicons name="sync-outline" size={22} color="#666" />
                <Text style={styles.resetIconText}>Reset</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {actionLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#DD2476" />
          <Text style={{ marginTop: 10, color: '#444' }}>Түр хүлээнэ үү...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1a1a1a', marginTop: 40 },
  headerDesc: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 20 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    gap: 10,
    elevation: 4,
    shadowColor: '#DD2476',
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  createBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#444', marginBottom: 15 },
  displayCard: { 
    backgroundColor: 'white', padding: 15, borderRadius: 18, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5
  },
  displayInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  displayEmail: { fontSize: 14, fontWeight: '600', color: '#333' },
  displayStatus: { fontSize: 12, color: '#4caf50', marginTop: 2 },
  resetIconBtn: { alignItems: 'center', padding: 10, minWidth: 60 },
  resetIconText: { fontSize: 10, color: '#888', marginTop: 2 },
  resultCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 25, borderWidth: 2, borderColor: '#DD2476' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  resultTitle: { fontSize: 16, fontWeight: '800', flex: 1, marginLeft: 10 },
  infoRow: { backgroundColor: '#fdf2f8', padding: 12, borderRadius: 12, marginBottom: 10 },
  copyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  label: { fontSize: 11, color: '#888', textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '700', color: '#333' },
  emptyText: { textAlign: 'center', color: '#bbb', marginTop: 40 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }
});