import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions
} from "react-native";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "expo-router";
import { 
  ChevronLeft, 
  Check, 
  Users, 
  ShieldCheck, 
  Calendar as CalendarIcon, 
  Building2,
  Info 
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";

// Зөвхөн гар утсанд зориулсан сан. Веб дээр ажиллахгүй тул доорх логикоор зохицуулна.
let DateTimePicker: any;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const { width } = Dimensions.get("window");

export default function CreateProjectScreen() {
  const { users, user, token, departments, setProjects } = useApp() as any;
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Огноо хадгалах
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Сонголтууд
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]); 
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]); 
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);

  const eligibleLeads = useMemo(() => users?.filter((u: any) => 
    ['admin', 'manager', 'lead'].includes(u.role?.toLowerCase())) || [], [users]);
  
  const eligibleWorkers = useMemo(() => users?.filter((u: any) => 
    ['employee', 'worker', 'lead'].includes(u.role?.toLowerCase())) || [], [users]);

  // Хэлтэс сонгоход ажилчдыг автоматаар нэмэх
  const toggleDept = (deptId: number) => {
    const isSelected = selectedDepts.includes(deptId);
    if (isSelected) {
      setSelectedDepts(prev => prev.filter(id => id !== deptId));
    } else {
      setSelectedDepts(prev => [...prev, deptId]);
      const deptMembers = users
        .filter((u: any) => (u.department === deptId || u.department_id === deptId))
        .map((u: any) => u.id);
      setSelectedWorkers(prev => Array.from(new Set([...prev, ...deptMembers])));
    }
  };

  // Огноо сонгох функц (Мобайл)
  const onDateChange = (type: 'start' | 'end', event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      type === 'start' ? setShowStartPicker(false) : setShowEndPicker(false);
    }
    if (date) {
      type === 'start' ? setStartDate(date) : setEndDate(date);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert("Алдаа", "Нэр оруулна уу.");
    if (selectedLeads.length === 0) return Alert.alert("Алдаа", "Удирдлага сонгоно уу.");

    setLoading(true);
    const allMembers = Array.from(new Set([...selectedLeads, ...selectedWorkers, user?.id].filter(Boolean)));

    try {
      const response = await fetch('http://192.168.144.53:8000/api/tasks/projects/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          status: 'active',
          owner: user?.id,
          members: allMembers,
          departments: selectedDepts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProjects((prev: any) => [data, ...prev]);
        router.back();
      } else {
        Alert.alert("Алдаа", "Төсөл хадгалахад алдаа гарлаа.");
      }
    } catch (error) {
      Alert.alert("Алдаа", "Сервертэй холбогдож чадсангүй.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Шинэ төсөл</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>Төслийн нэр</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Нэр..." />

          <Text style={[styles.label, { marginTop: 20 }]}>Тайлбар</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Тайлбар..." />

          {/* ОГНОО СОНГОХ ХЭСЭГ (WEB vs MOBILE) */}
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.label}>Эхлэх</Text>
              {Platform.OS === 'web' ? (
                <input 
                  type="date" 
                  style={webInputStyle} 
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
              ) : (
                <TouchableOpacity style={styles.dateBox} onPress={() => setShowStartPicker(true)}>
                  <CalendarIcon size={16} color="#4F46E5" />
                  <Text style={styles.dateText}>{format(startDate, 'yyyy-MM-dd')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.dateItem}>
              <Text style={styles.label}>Дуусах</Text>
              {Platform.OS === 'web' ? (
                <input 
                  type="date" 
                  style={webInputStyle} 
                  value={format(endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                />
              ) : (
                <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndPicker(true)}>
                  <CalendarIcon size={16} color="#EF4444" />
                  <Text style={styles.dateText}>{format(endDate, 'yyyy-MM-dd')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Гар утасны Picker */}
        {Platform.OS !== 'web' && showStartPicker && (
          <DateTimePicker value={startDate} mode="date" display="default" onChange={(e: any, d?: Date) => onDateChange('start', e, d)} />
        )}
        {Platform.OS !== 'web' && showEndPicker && (
          <DateTimePicker value={endDate} mode="date" display="default" onChange={(e: any, d?: Date) => onDateChange('end', e, d)} />
        )}

        {/* ХЭЛТСҮҮД */}
        <Text style={styles.sectionTitle}>Хэлтсүүд</Text>
        <View style={styles.deptGrid}>
          {departments?.map((dept: any) => (
            <TouchableOpacity key={dept.id} onPress={() => toggleDept(dept.id)} style={[styles.deptChip, selectedDepts.includes(dept.id) && styles.selectedDeptChip]}>
              <Text style={[styles.deptText, selectedDepts.includes(dept.id) && {color: '#FFF'}]}>{dept.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* УДИРДЛАГА */}
        <Text style={styles.sectionTitle}>Удирдлага</Text>
        <View style={styles.userGrid}>
          {eligibleLeads.map((m: any) => (
            <UserCard key={m.id} user={m} selected={selectedLeads.includes(m.id)} onPress={() => setSelectedLeads(prev => prev.includes(m.id) ? prev.filter(i => i !== m.id) : [...prev, m.id])} color="#4F46E5" />
          ))}
        </View>

        {/* ГИШҮҮД */}
        <Text style={styles.sectionTitle}>Ажилчид ({selectedWorkers.length})</Text>
        <View style={styles.userGrid}>
          {eligibleWorkers.map((m: any) => (
            <UserCard key={m.id} user={m} selected={selectedWorkers.includes(m.id)} onPress={() => setSelectedWorkers(prev => prev.includes(m.id) ? prev.filter(i => i !== m.id) : [...prev, m.id])} color="#10B981" />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.gradientBtn}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createBtnText}>Төсөл үүсгэх</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const UserCard = ({ user, selected, onPress, color }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.userCard, selected && { borderColor: color, backgroundColor: color + '08' }]}>
    <View style={[styles.avatar, { backgroundColor: selected ? color : '#CBD5E1' }]}>
      <Text style={styles.avatarText}>{(user.first_name || user.username)[0]}</Text>
    </View>
    <Text style={styles.userName} numberOfLines={1}>{user.first_name || user.username}</Text>
    {selected && <View style={[styles.checkBadge, {backgroundColor: color}]}><Check size={10} color="#FFF" /></View>}
  </TouchableOpacity>
);

// Веб оролтын стиль
const webInputStyle = {
  padding: '10px',
  borderRadius: '12px',
  border: '1px solid #F1F5F9',
  backgroundColor: '#F8FAFB',
  width: '100%',
  color: '#1E293B',
  fontSize: '14px'
} as any;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  backBtn: { width: 44, height: 44, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, elevation: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' },
  textArea: { height: 80, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
  dateItem: { flex: 1 },
  dateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9', gap: 8 },
  dateText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 25, marginBottom: 15 },
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  selectedDeptChip: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  deptText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  userGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  userCard: { width: width * 0.28, padding: 12, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#F1F5F9', alignItems: 'center', position: 'relative' },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { color: '#FFF', fontWeight: '700' },
  userName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  checkBadge: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF' },
  createBtn: { borderRadius: 18, overflow: 'hidden' },
  gradientBtn: { paddingVertical: 16, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontWeight: '700' }
});