import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import axios from 'axios';
import { useApp } from '../../contexts/AppContext';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Department {
  id: number;
  name: string;
}

export default function CreateTeamScreen() {
  const { token } = useApp();

  const [teamName, setTeamName] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDepts, setIsFetchingDepts] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);

  // ---------------- FETCH ----------------
  const fetchDepartments = useCallback(async () => {
    if (!token) return;

    setIsFetchingDepts(true);
    try {
      const res = await axios.get(
        // 'http://192.168.220.53:8081/api/organizations/departments/',
        'http://192.168.144.53:8000/api/organizations/departments/',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDepartments(res.data || []);
    } catch (err) {
      setErrorMessage('Хэлтэс татаж чадсангүй');
    } finally {
      setIsFetchingDepts(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // ---------------- CREATE ----------------
  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;

    setIsLoading(true);

    try {
      await axios.post(
        // 'http://192.168.220.53:8081/api/organizations/teams/',
        'http://192.168.144.53:8000/api/organizations/teams/',
        {
          name: teamName.trim(),
          department: selectedDeptId,
          members: [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowSuccess(true);

    } catch (err) {
      setErrorMessage('Баг үүсгэж чадсангүй');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- LOADING ----------------
  if (isFetchingDepts) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9b59b6" />
        <Text style={{ marginTop: 10 }}>Ачаалж байна...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* TITLE */}
        <Text style={styles.title}>Шинэ баг үүсгэх</Text>

        {/* ERROR */}
        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* INPUT */}
        <TextInput
          style={styles.input}
          placeholder="Багийн нэр..."
          placeholderTextColor="#aaa"
          value={teamName}
          onChangeText={setTeamName}
        />

        {/* DEPARTMENTS */}
        <View style={styles.chipContainer}>
          {departments.map((d) => {
            const selected = selectedDeptId === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() =>
                  setSelectedDeptId(selected ? null : d.id)
                }
                style={[styles.chip, selected && styles.chipActive]}
              >
                <Text style={[styles.chipText, selected && { color: '#fff' }]}>
                  {d.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          disabled={isLoading}
          onPress={handleCreateTeam}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#9b59b6', '#e056fd']}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Баг үүсгэх</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalBox}>
            
            <LottieView
              source={require('../../assets/success.json')}
              autoPlay
              loop={false}
              style={{ width: 150, height: 150 }}
            />

            <Text style={styles.successTitle}>Амжилттай!</Text>
            <Text style={styles.successText}>
              Баг амжилттай үүслээ 🎉
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                setTeamName('');
                setSelectedDeptId(null);
              }}
            >
              <LinearGradient
                colors={['#9b59b6', '#e056fd']}
                style={styles.modalBtn}
              >
                <Text style={{ color: '#fff' }}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: {
    padding: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    color: '#333',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    backdropFilter: 'blur(10px)',
  },

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: '#eee',
  },

  chipActive: {
    backgroundColor: '#9b59b6',
  },

  chipText: {
    fontSize: 14,
  },

  button: {
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  errorBox: {
    backgroundColor: '#fee',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },

  errorText: {
    color: 'red',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '85%',
  },

  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
  },

  successText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#555',
  },

  modalBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
});