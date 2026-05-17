import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  SafeAreaView 
} from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { User, Calendar as CalendarIcon, ChevronLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateTaskScreen() {
  const { token, user, createTask, projects, users: allSystemUsers } = useApp() as any;
  const router = useRouter();
  const { projectId } = useLocalSearchParams();

  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number[]>([]);
  
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [dueDate, setDueDate] = useState(''); 

  // Гүйцэтгэгч сонгох/хасах функц
  const toggleUserSelection = (userId: number) => {
    setAssignedTo(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Хэрэглэгчдийг татах логик
  useEffect(() => {
    const setupUsers = async () => {
      setLoading(true);
      try {
        if (projectId && projects) {
          const currentProject = projects.find((p: any) => String(p.id) === String(projectId));
          if (currentProject) {
            const memberIds = currentProject.members || [];
            const projectMembers = allSystemUsers.filter((u: any) => 
              memberIds.map(String).includes(String(u.id))
            );
            setAssignableUsers(projectMembers);
          }
        } else if (user?.department) {
          const BASE_URL = Platform.OS === 'android' ? 'http://192.168.144.53:8000' : 'http://192.168.144.53:8000';
          const res = await fetch(`${BASE_URL}/api/users/users/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allUsers = await res.json();
          const filtered = allUsers.filter((u: any) => String(u.department) === String(user.department));
          setAssignableUsers(filtered);
        }
      } catch (e) {
        console.error("Fetch users error:", e);
      } finally {
        setLoading(false);
      }
    };

    setupUsers();
  }, [projectId, projects, allSystemUsers, user?.department, token]);

  // Хугацаа өөрчлөгдөхөд ажиллах функц (Mobile)
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // iOS дээр нээлттэй үлдээж болно, Android дээр хаагдана
    if (selectedDate) {
      setDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDueDate(`${year}-${month}-${day}`);
    }
  };

  // Даалгавар үүсгэх функц
  const handleCreateTask = async () => {
    if (!title || assignedTo.length === 0) {
      return Alert.alert("Алдаа", "Гарчиг болон гүйцэтгэгчийг сонгоно уу");
    }

    const taskData = {
      title,
      description,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      status: 'todo',
      priority: 'medium',
      project: projectId ? Number(projectId) : null,
    };

    const res = await createTask(taskData);

    if (res.success) {
      Alert.alert("Амжилттай", "Даалгавар үүсгэлээ");
      router.back();
    } else {
      Alert.alert("Алдаа", res.error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {projectId ? "Төсөлд даалгавар нэмэх" : "Даалгавар оноох"}
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Даалгаврын нэр</Text>
        <TextInput 
          style={styles.input} 
          value={title} 
          onChangeText={setTitle} 
          placeholder="Юу хийх вэ?..." 
        />

        <Text style={styles.label}>Тайлбар</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          multiline 
          value={description} 
          onChangeText={setDescription} 
          placeholder="Дэлгэрэнгүй мэдээлэл..." 
        />

        <Text style={styles.label}>Дуусах хугацаа</Text>
        <View style={styles.inputRow}>
          <CalendarIcon size={20} color="#6B7280" style={{marginRight: 10}} />
          
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setDate(new Date(e.target.value));
              }}
              style={styles.webDatePicker}
            />
          ) : (
            <TouchableOpacity 
              style={styles.dateDisplay} 
              onPress={() => setShowPicker(true)}
            >
              <Text style={{ color: dueDate ? '#111827' : '#9CA3AF' }}>
                {dueDate || 'Хугацаа сонгох'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showPicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={styles.label}>
          Гүйцэтгэгч сонгох {projectId ? "(Төслийн баг)" : `(${user?.department_name || ''})`}
        </Text>
        
        {loading ? (
          <ActivityIndicator color="#4F46E5" style={{ marginTop: 10 }} />
        ) : (
          <View style={styles.memberList}>
            {assignableUsers.length > 0 ? (
              assignableUsers.map((emp) => (
                <TouchableOpacity 
                  key={emp.id}
                  style={[
                    styles.memberChip, 
                    assignedTo.includes(emp.id) && styles.activeMember
                  ]}
                  onPress={() => toggleUserSelection(emp.id)}
                >
                  <User size={16} color={assignedTo.includes(emp.id) ? "#10B981" : "#6B7280"} />
                  <Text style={[styles.memberText, assignedTo.includes(emp.id) && styles.activeMemberText]}>
                    {emp.first_name || emp.username}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Гүйцэтгэгч олдсонгүй.</Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTask}>
          <Text style={styles.submitText}>Үүсгэх</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  backBtn: { padding: 5, marginRight: 10 },
  headerText: { fontSize: 20, fontWeight: 'bold' },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginTop: 20, 
    marginBottom: 8, 
    color: '#374151' 
  },
  input: { 
    backgroundColor: '#F9FAFB', 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    fontSize: 16
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
  },
  dateDisplay: { flex: 1 },
  // ЭНД АЛДААТАЙ БАЙСАН ХЭСГИЙГ ЗАСАВ:
  webDatePicker: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 16,
    color: '#111827',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  memberChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 25, 
    backgroundColor: '#fff',
    gap: 6
  },
  activeMember: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  memberText: { color: '#4B5563', fontWeight: '500' },
  activeMemberText: { color: '#065F46' },
  emptyText: { color: '#9CA3AF', marginTop: 10 },
  submitBtn: { 
    backgroundColor: '#111827', 
    padding: 18, 
    borderRadius: 15, 
    marginTop: 40, 
    alignItems: 'center' 
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});