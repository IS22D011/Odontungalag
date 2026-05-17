import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../contexts/AppContext';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreateDepartmentScreen() {
  const { createDepartment, departments, fetchDepartments, user } = useApp() as any;
  const router = useRouter();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Хэлтсүүдийг татах функц
  const loadDepartments = useCallback(async () => {
    if (typeof fetchDepartments === 'function') {
      setFetching(true);
      await fetchDepartments();
      setFetching(false);
    }
  }, [fetchDepartments]);

  // Дэлгэц ачаалагдах үед нэг удаа татах
  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  if (user?.role !== "admin") {
    return <Redirect href="/(tabs)" />;
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Алдаа", "Хэлтсийн нэрийг оруулна уу");
      return;
    }

    setLoading(true);
    const res = await createDepartment(name.trim());
    setLoading(false);

    if (res.success) {
      Alert.alert("Амжилттай", `${name} хэлтэс бүртгэгдлээ`);
      setName('');
      Keyboard.dismiss();
      // Жагсаалтыг шинэчлэх
      loadDepartments();
    } else {
      Alert.alert("Алдаа", res.error);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerArea}>
      <Text style={styles.title}>Хэлтэс удирдлага</Text>
      <Text style={styles.subtitle}>
        Байгууллагынхаа бүтэц, зохион байгуулалтыг тодорхойлохын тулд хэлтэс нэмнэ үү.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Шинэ хэлтсийн нэр</Text>
        <TextInput
          style={styles.input}
          placeholder="Жишээ нь: Маркетингийн хэлтэс"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <TouchableOpacity onPress={handleCreate} disabled={loading}>
        <LinearGradient
          colors={['#4f46e5', '#7c3aed']}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Хэлтэс нэмэх</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.listTitle}>Нийт хэлтсүүд ({departments?.length || 0})</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FlatList
        data={departments}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshing={fetching}
        onRefresh={loadDepartments}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.deptCard}>
            <View style={styles.deptIcon}>
              <Ionicons name="business" size={20} color="#4f46e5" />
            </View>
            <Text style={styles.deptName}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
        )}
        ListEmptyComponent={() => !fetching && (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Одоогоор хэлтэс бүртгэгдээгүй байна.</Text>
          </View>
        )}
      />
      
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.floatingBackBtn}
      >
        <Ionicons name="arrow-back" size={24} color="#6b7280" />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// ... (Styles хэсэг таны анхны кодтой ижил тул зай хэмнэх үүднээс алгасав)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  listContent: { padding: 24, paddingTop: 80 },
  headerArea: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 32, lineHeight: 22 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#4B5563', marginBottom: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#fff' },
  button: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },
  listTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  deptCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
  deptIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  deptName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 10 },
  floatingBackBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: '#fff', padding: 8, borderRadius: 12, elevation: 5 }
});