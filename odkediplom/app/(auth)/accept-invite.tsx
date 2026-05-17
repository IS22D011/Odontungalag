import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { UserCheck, User, Phone, Lock, ChevronLeft, ShieldCheck } from "lucide-react-native";
import axios from 'axios';

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    repassword: '',
  });

  const handleAcceptInvite = async () => {
    if (formData.password !== formData.repassword) {
      Alert.alert("Алдаа", "Нууц үгүүд зөрүүтэй байна.");
      return;
    }

    try {
      // API URL-аа өөрийн орчинд тохируулаарай
      const response = await axios.post('http://192.168.144.53:8000/api/users/accept-invite/', {
        token: token,
        ...formData
      });

      if (response.status === 201) {
        Alert.alert("Амжилттай", "Бүртгэл амжилттай боллоо. Одоо нэвтэрнэ үү.");
        router.replace('/login');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Алдаа гарлаа";
      Alert.alert("Алдаа", errorMsg);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      {/* Header - Бусад хуудастай ижил Indigo Gradient */}
      <LinearGradient colors={["#1E1B4B", "#312E81", "#4338CA"]} style={styles.header}>
        <SafeAreaView>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Урилга баталгаажуулах</Text>
            <Text style={styles.subtitle}>Байгууллагын гишүүнээр бүртгүүлэх</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.flex}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <View style={styles.infoBox}>
              <ShieldCheck size={20} color="#10B981" />
              <Text style={styles.infoText}>Таны урилга хүчинтэй байна. Мэдээллээ бөглөж бүртгэлээ гүйцээнэ үү.</Text>
            </View>

            {/* Хувийн мэдээлэл */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Овог, нэр</Text>
              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Овог"
                    onChangeText={(val) => setFormData({ ...formData, last_name: val })}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Нэр"
                    onChangeText={(val) => setFormData({ ...formData, first_name: val })}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>

            {/* Утасны дугаар */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Холбоо барих</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color="#94A3B8" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Утасны дугаар"
                  keyboardType="phone-pad"
                  onChangeText={(val) => setFormData({ ...formData, phone: val })}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Нууц үг */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Нууц үг тохируулах</Text>
              <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
                <Lock size={18} color="#94A3B8" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Шинэ нууц үг"
                  secureTextEntry
                  onChangeText={(val) => setFormData({ ...formData, password: val })}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Нууц үг давтах"
                  secureTextEntry
                  onChangeText={(val) => setFormData({ ...formData, repassword: val })}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <TouchableOpacity onPress={handleAcceptInvite} activeOpacity={0.9}>
              <LinearGradient 
                colors={["#10B981", "#059669"]} 
                start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
                style={styles.button}
              >
                <View style={styles.btnInner}>
                  <UserCheck size={20} color="#fff" />
                  <Text style={styles.buttonText}>Бүртгэл баталгаажуулах</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            Та бүртгүүлснээр байгууллагын дотоод журмыг хүлээн зөвшөөрсөнд тооцогдоно.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  flex: { flex: 1 },
  header: {
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headerTextContainer: { marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: 15, color: "#A5B4FC", marginTop: 4 },
  scrollContent: { paddingHorizontal: 24, marginTop: -40, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#1E1B4B",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5'
  },
  infoText: { flex: 1, color: '#065F46', fontSize: 13, fontWeight: '500' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1E293B" },
  button: { 
    padding: 16, 
    borderRadius: 14, 
    alignItems: "center", 
    marginTop: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  termsText: { 
    textAlign: 'center', 
    fontSize: 12, 
    color: '#94A3B8', 
    marginTop: 20, 
    lineHeight: 18,
    paddingHorizontal: 20
  }
});