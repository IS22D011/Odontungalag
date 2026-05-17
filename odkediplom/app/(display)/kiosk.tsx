import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { format } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { LogOut, LogIn, DoorOpen } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const QR_EXPIRY_SECONDS = 30;

export default function AdminQRScreen() {
  const { user, logout } = useApp() as any;
  const [seconds, setSeconds] = useState(QR_EXPIRY_SECONDS);
  const [expiry, setExpiry] = useState(() => Math.floor(Date.now() / 1000) + QR_EXPIRY_SECONDS);
  const [mode, setMode] = useState<'IN' | 'OUT'>('IN');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Таймер: секунд тоолох + QR сэргээх
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSeconds((prev) => {
        if (prev <= 1) {
          const newExpiry = Math.floor(Date.now() / 1000) + QR_EXPIRY_SECONDS;
          setExpiry(newExpiry);
          return QR_EXPIRY_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mode солигдоход QR шинэчлэх
  const handleModeChange = (newMode: 'IN' | 'OUT') => {
    setMode(newMode);
    setExpiry(Math.floor(Date.now() / 1000) + QR_EXPIRY_SECONDS);
    setSeconds(QR_EXPIRY_SECONDS);
  };

  const handleLogout = () => {
    const title = "Системээс гарах";
    const message = "Та дэлгэцийн горимоос гарахдаа итгэлтэй байна уу?";
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) logout();
    } else {
      Alert.alert(title, message, [
        { text: "Үгүй", style: "cancel" },
        { text: "Тийм", onPress: logout, style: 'destructive' },
      ]);
    }
  };

  const qrValue = useMemo(() => {
    const orgId = user?.organization?.id || user?.organization_id;
    if (!orgId) return "NO_ORG";
    // exp: Unix timestamp (секунд) — сервер энэ утгатай харьцуулна
    return JSON.stringify({ o: orgId, m: mode, exp: expiry });
  }, [user, expiry, mode]);

  const progressPercent = (seconds / QR_EXPIRY_SECONDS) * 100;
  const timerColor = mode === 'IN' ? '#4F46E5' : '#F59E0B';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut color="#9CA3AF" size={20} />
        <Text style={styles.logoutText}>Гарах</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.orgName}>{user?.organization?.name || "Байгууллагын нэр"}</Text>

        {/* IN / OUT сонгох */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'IN' && styles.activeIn]}
            onPress={() => handleModeChange('IN')}
          >
            <LogIn color={mode === 'IN' ? '#fff' : '#9CA3AF'} size={22} />
            <Text style={[styles.modeText, mode === 'IN' && styles.activeText]}>Ирэх цаг</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'OUT' && styles.activeOut]}
            onPress={() => handleModeChange('OUT')}
          >
            <DoorOpen color={mode === 'OUT' ? '#fff' : '#9CA3AF'} size={22} />
            <Text style={[styles.modeText, mode === 'OUT' && styles.activeText]}>Тарах цаг</Text>
          </TouchableOpacity>
        </View>

        {/* QR код */}
        <View style={[styles.qrWrapper, mode === 'OUT' && styles.qrWrapperOut]}>
          {qrValue === "NO_ORG" ? (
            <Text style={styles.errorText}>Тохиргоо дутуу байна</Text>
          ) : (
            <QRCode
              value={qrValue}
              size={width * 0.55}
              color="#000"
              backgroundColor="white"
            />
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.timerContainer}>
          <View style={styles.timerTrack}>
            <View style={[styles.timerBar, { width: `${progressPercent}%`, backgroundColor: timerColor }]} />
          </View>
          <Text style={styles.timerText}>Шинэчлэхэд: {seconds}с</Text>
        </View>

        <Text style={styles.instruction}>
          {mode === 'IN' ? "Өглөөний ирцээ бүртгүүлнэ үү" : "Оройн таралтын бүртгэл"}
        </Text>
        <Text style={styles.liveDate}>{format(currentTime, "yyyy.MM.dd HH:mm:ss")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  logoutButton: {
    position: 'absolute', top: 50, right: 20,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20,
  },
  logoutText: { color: '#9CA3AF', fontSize: 14, marginLeft: 8 },
  content: { alignItems: 'center', width: '90%' },
  orgName: { color: '#9CA3AF', fontSize: 18, fontWeight: '600', marginBottom: 20 },
  modeContainer: {
    flexDirection: 'row', backgroundColor: '#1F2937',
    borderRadius: 15, padding: 6, marginBottom: 40, width: 350,
  },
  modeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8,
  },
  activeIn: { backgroundColor: '#4F46E5' },
  activeOut: { backgroundColor: '#F59E0B' },
  modeText: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 16 },
  activeText: { color: '#fff' },
  qrWrapper: {
    backgroundColor: '#FFFFFF', padding: 20, borderRadius: 30,
    borderWidth: 5, borderColor: '#4F46E5',
  },
  qrWrapperOut: { borderColor: '#F59E0B' },
  timerContainer: { marginTop: 30, width: 260, alignItems: 'center', gap: 8 },
  timerTrack: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: '#374151', overflow: 'hidden',
  },
  timerBar: { height: '100%', borderRadius: 3 },
  timerText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  instruction: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 40, textAlign: 'center' },
  liveDate: { color: '#9CA3AF', fontSize: 14, marginTop: 10 },
  errorText: { color: '#EF4444', fontWeight: 'bold' },
});