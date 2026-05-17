import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../contexts/AppContext';

export default function InviteMemberScreen() {
  const { token, user } = useApp();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'employee' | 'manager' | 'admin'>('employee');
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchingDepts, setFetchingDepts] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 1. Хэлтсүүдийн жагсаалтыг серверээс татах
  useEffect(() => {
    const fetchDepartments = async () => {
      setFetchingDepts(true);
      try {
        // const response = await fetch('http://192.168.220.53:8081/api/organizations/departments/', {
        const response = await fetch('http://192.168.144.53:8000/api/organizations/departments/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setDepartments(data);
        }
      } catch (err) {
        console.error("Departments fetch error:", err);
      } finally {
        setFetchingDepts(false);
      }
    };

    if (token) fetchDepartments();
  }, [token]);

  // 2. Урилга илгээх функц
  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Имэйл оруулна уу');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // const response = await fetch('http://192.168.220.53:8081/api/organizations/invite/', {
      const response = await fetch('http://192.168.144.53:8000/api/organizations/invite/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role: role,
          department: selectedDept, // ID явуулна
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        // Серверээс ирсэн алдааны мессежийг харуулах
        setError(data.error || data.detail || 'Урилга илгээж чадсангүй');
      }
    } catch (err) {
      setError('Сервертэй холбогдоход алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8f9fa' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ажилтан урих</Text>
        <Text style={styles.subtitle}>Шинэ ажилтны имэйл болон үүргийг тодорхойлно уу.</Text>

        {/* EMAIL INPUT */}
        <View style={styles.section}>
          <Text style={styles.label}>Имэйл хаяг</Text>
          <TextInput
            style={styles.input}
            placeholder="ажилтан@байгууллага.mn"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* ROLE SELECT */}
        <View style={styles.section}>
          <Text style={styles.label}>Систем дэх үүрэг (Role)</Text>
          <View style={styles.row}>
            {['employee', 'manager', 'admin'].map((r) => {
              const isActive = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r as any)}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isActive && { color: '#fff' }]}>
                    {r === 'employee' ? 'Ажилтан' : r === 'manager' ? 'Менежер' : 'Админ'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* DEPARTMENT SELECT */}
        <View style={styles.section}>
          <Text style={styles.label}>Хэлтэс сонгох</Text>
          {fetchingDepts ? (
            <ActivityIndicator size="small" color="#9b59b6" />
          ) : (
            <View style={[styles.row, { flexWrap: 'wrap' }]}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  onPress={() => setSelectedDept(dept.id)}
                  style={[styles.chip, selectedDept === dept.id && styles.deptActive]}
                >
                  <Text style={[styles.chipText, selectedDept === dept.id && { color: '#fff' }]}>
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {departments.length === 0 && <Text style={{color: '#999'}}>Хэлтэс үүсгээгүй байна.</Text>}
            </View>
          )}
        </View>

        {/* ERROR MESSAGE */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* SUBMIT BUTTON */}
        <TouchableOpacity onPress={handleInvite} disabled={loading} style={{ marginTop: 20 }}>
          <LinearGradient
            colors={['#6a11cb', '#2575fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Урилга илгээх</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal visible={success} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 40 }}>📩</Text>
            </View>
            <Text style={styles.successTitle}>Амжилттай илгээлээ!</Text>
            <Text style={styles.successText}>
              {email} хаяг руу урилгын линк илгээгдсэн.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSuccess(false);
                setEmail('');
                setSelectedDept(null);
              }}
              style={{ width: '100%' }}
            >
              <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Ойлголоо</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: {
    backgroundColor: '#6a11cb',
    borderColor: '#6a11cb',
  },
  deptActive: {
    backgroundColor: '#2575fc',
    borderColor: '#2575fc',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  button: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#fff0f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4d4d',
  },
  errorText: {
    color: '#cc0000',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    width: '85%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 15,
    lineHeight: 20,
  },
  modalBtn: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});