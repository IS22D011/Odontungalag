import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, FlatList, Keyboard
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useApp } from '@/contexts/AppContext';
import MapComponent from '../../components/MapComponent';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { 
    user, updateOrganization, createDepartment, 
    departments, fetchDepartments 
  } = useApp() as any;

  // Дэлгэцийн сонголт: 'org' эсвэл 'dept'
  const [activeTab, setActiveTab] = useState<'org' | 'dept'>('org');

  // --- БАЙГУУЛЛАГЫН STATE ---
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [radius, setRadius] = useState('100');
  const [lat, setLat] = useState('47.9185');
  const [lng, setLng] = useState('106.9177');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  // --- ХЭЛТСИЙН STATE ---
  const [deptName, setDeptName] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (user) {
      setOrgName(user.organization_name || '');
      setRadius(user.organization_radius?.toString() || '100');
      setLat(user.organization_latitude?.toString() || '47.9185');
      setLng(user.organization_longitude?.toString() || '106.9177');
      setStartTime(user.organization_start_time || '09:00');
      setEndTime(user.organization_end_time || '18:00');
    }
  }, [user]);

  const loadDepartments = useCallback(async () => {
    if (typeof fetchDepartments === 'function') {
      setFetching(true);
      await fetchDepartments();
      setFetching(false);
    }
  }, [fetchDepartments]);

  useEffect(() => {
    if (activeTab === 'dept') loadDepartments();
  }, [activeTab, loadDepartments]);

  const region = useMemo(() => ({
    latitude: parseFloat(lat),
    longitude: parseFloat(lng),
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  }), [lat, lng]);

  if (user?.role !== "admin") return <Redirect href="/(tabs)" />;

  // --- БАЙГУУЛЛАГА ХАДГАЛАХ ---
  const handleSaveOrg = async () => {
    setLoading(true);
    try {
      const res = await updateOrganization({
        name: orgName,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        radius: parseInt(radius),
        start_time: startTime,
        end_time: endTime,
      });
      if (res.success) {
        Alert.alert('Амжилттай', 'Байгууллагын мэдээлэл шинэчлэгдлээ');
      } else {
        Alert.alert('Алдаа', res.error || 'Алдаа гарлаа');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- ХЭЛТЭС ҮҮСГЭХ ---
  const handleCreateDept = async () => {
    if (!deptName.trim()) return Alert.alert("Алдаа", "Хэлтсийн нэрийг оруулна уу");
    setDeptLoading(true);
    const res = await createDepartment(deptName.trim());
    setDeptLoading(false);
    if (res.success) {
      setDeptName('');
      Keyboard.dismiss();
      loadDepartments();
      Alert.alert("Амжилттай", "Хэлтэс бүртгэгдлээ");
    } else {
      Alert.alert("Алдаа", res.error);
    }
  };

  const getCurrentLocation = async () => {
    setLocLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return alert('Байршил тогтоох эрхийг зөвшөөрнө үү');
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setLat(location.coords.latitude.toString());
      setLng(location.coords.longitude.toString());
    } catch (e) {
      alert('Байршил тогтооход алдаа гарлаа.');
    } finally {
      setLocLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Header & Tabs */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Удирдлага</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'org' && styles.activeTab]} 
          onPress={() => setActiveTab('org')}
        >
          <Text style={[styles.tabText, activeTab === 'org' && styles.activeTabText]}>Байгууллага</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'dept' && styles.activeTab]} 
          onPress={() => setActiveTab('dept')}
        >
          <Text style={[styles.tabText, activeTab === 'dept' && styles.activeTabText]}>Хэлтсүүд</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'org' ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.mapBox}>
            <MapComponent key={`${lat}-${lng}`} region={region} lat={lat} lng={lng} radius={radius} setLat={setLat} setLng={setLng} />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={getCurrentLocation}>
              {locLoading ? <ActivityIndicator size="small" color="#4F46E5" /> : <Text style={styles.secondaryBtnText}>📍 Миний байршил</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => Linking.openURL(`http://maps.google.com/q=${lat},${lng}`)}>
              <Text style={styles.secondaryBtnText}>🗺️ Maps-д нээх</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Байгууллагын нэр</Text>
            <TextInput style={styles.input} value={orgName} onChangeText={setOrgName} />
            
            <View style={styles.coordRow}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Text style={styles.label}>Эхлэх цаг</Text>
                <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} />
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                <Text style={styles.label}>Тарах цаг</Text>
                <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} />
              </View>
            </View>

            <Text style={styles.label}>Радиус (метр)</Text>
            <TextInput style={styles.input} value={radius} onChangeText={setRadius} keyboardType="numeric" />

            <TouchableOpacity style={[styles.saveBtn, loading && styles.btnDisabled]} onPress={handleSaveOrg} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'Хадгалж байна...' : 'Мэдээлэл шинэчлэх'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={departments}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={loadDepartments}
          refreshing={fetching}
          ListHeaderComponent={() => (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.label}>Шинэ хэлтэс нэмэх</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Хэлтсийн нэр" 
                value={deptName} 
                onChangeText={setDeptName} 
              />
              <TouchableOpacity onPress={handleCreateDept} disabled={deptLoading}>
                <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.deptAddBtn}>
                  {deptLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Нэмэх</Text>}
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.divider} />
              <Text style={styles.listTitle}>Бүртгэлтэй хэлтсүүд ({departments?.length || 0})</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.deptCard}>
              <Ionicons name="business" size={20} color="#4f46e5" style={{ marginRight: 12 }} />
              <Text style={styles.deptName}>{item.name}</Text>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 60, backgroundColor: '#fff' },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  tabContainer: { flexDirection: 'row', padding: 4, backgroundColor: '#F3F4F6', margin: 16, borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1 },
  tabText: { color: '#6B7280', fontWeight: '600' },
  activeTabText: { color: '#4F46E5' },
  scroll: { padding: 16 },
  listContent: { padding: 16 },
  mapBox: { height: 200, borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  secondaryBtn: { flex: 0.48, padding: 12, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  secondaryBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
  form: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 6, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', padding: 12, borderRadius: 10, marginBottom: 15, backgroundColor: '#F9FAFB' },
  coordRow: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center' },
  deptAddBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  listTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  deptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  deptName: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
});