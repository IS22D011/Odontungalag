import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, Platform 
} from 'react-native';
import { useApp } from "@/contexts/AppContext";
import { Calendar as CalendarIcon } from "lucide-react-native";
import axios from 'axios';
import { useRouter } from 'expo-router';

// Зөвхөн Mobile дээр ашиглахын тулд нөхцөлтэй import хийнэ
let DateTimePicker: any;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function CreateLeaveScreen() {
  const { token } = useApp() as any;
  const router = useRouter();
  
  const [leaveType, setLeaveType] = useState('personal');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  
  // Mobile-д зориулсан picker-ийн төлөв
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert("Алдаа", "Шалтгаанаа бичнэ үү.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `http://192.168.144.53:8000/api/hr/leaves/`,
        {
          leave_type: leaveType,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          reason: reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Амжилттай", "Хүсэлт илгээгдлээ.");
      router.back();
    } catch (error) {
      Alert.alert("Алдаа", "Хүсэлт илгээхэд алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  // Вэб дээр ажиллах огноо сонгогч (Standard HTML Date Input)
  const renderDatePicker = (currentDate: Date, setter: (d: Date) => void, show: boolean, setShow: (b: boolean) => void) => {
    if (Platform.OS === 'web') {
      return (
        <input
          type="date"
          style={webStyles.dateInput}
          value={currentDate.toISOString().split('T')[0]}
          onChange={(e) => setter(new Date(e.target.value))}
        />
      );
    } else {
      return (
        <>
          <TouchableOpacity style={styles.datePickerBox} onPress={() => setShow(true)}>
            <CalendarIcon size={20} color="#6366f1" />
            <Text style={styles.dateValue}>{currentDate.toDateString()}</Text>
          </TouchableOpacity>
          {show && (
            <DateTimePicker
              value={currentDate}
              mode="date"
              display="default"
              onChange={(e: any, date?: Date) => {
                setShow(false);
                if (date) setter(date);
              }}
            />
          )}
        </>
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Чөлөөний төрөл</Text>
      <View style={styles.typeContainer}>
        {['personal', 'sick', 'annual'].map((type) => (
          <TouchableOpacity 
            key={type}
            style={[styles.typeButton, leaveType === type && styles.activeType]}
            onPress={() => setLeaveType(type)}
          >
            <Text style={[styles.typeText, leaveType === type && styles.activeTypeText]}>
              {type === 'personal' ? 'Хувийн' : type === 'sick' ? 'Өвчтэй' : 'Амралт'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Эхлэх хугацаа</Text>
      {renderDatePicker(startDate, setStartDate, showStart, setShowStart)}

      <Text style={styles.label}>Дуусах хугацаа</Text>
      {renderDatePicker(endDate, setEndDate, showEnd, setShowEnd)}

      <Text style={styles.label}>Шалтгаан</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={4}
        placeholder="Шалтгаанаа бичнэ үү..."
        value={reason}
        onChangeText={setReason}
      />

      <TouchableOpacity 
        style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitBtnText}>{loading ? 'Илгээж байна...' : 'Хүсэлт илгээх'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const webStyles = {
  dateInput: {
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: '16px',
    width: '100%',
    fontFamily: 'inherit'
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8, marginTop: 20 },
  typeContainer: { flexDirection: 'row', gap: 10 },
  typeButton: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  activeType: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  typeText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  activeTypeText: { color: '#fff' },
  datePickerBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  dateValue: { fontSize: 15, color: '#1e293b' },
  textArea: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#e2e8f0', height: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 40 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});