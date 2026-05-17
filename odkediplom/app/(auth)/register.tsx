import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, 
  Platform, SafeAreaView 
} from "react-native";
import { useApp } from "../../contexts/AppContext"; 
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Building2, User, Mail, Lock, ChevronLeft, ArrowRight } from "lucide-react-native";

export default function RegisterScreen() {
  const { registerOrganization } = useApp() as any; 
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    org_name: "", 
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    repassword: "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    const { org_name, first_name, last_name, email, password, repassword } = formData;

    if (!org_name.trim() || !first_name.trim() || !last_name.trim() || !email.trim() || !password) {
      Alert.alert("Алдаа", "Бүх талбарыг бүрэн бөглөнө үү.");
      return;
    }

    if (password !== repassword) {
      Alert.alert("Алдаа", "Нууц үгүүд таарахгүй байна.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerOrganization({
        org_name: org_name.trim(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      });
      
      if (result && result.success) {
        router.push({
          pathname: "/(auth)/verify-otp", 
          params: { email: email.trim().toLowerCase() }
        });
      } else {
        Alert.alert("Бүртгэл амжилтгүй", result?.error || "Тодорхойгүй алдаа гарлаа.");
      }
    } catch (error) {
      Alert.alert("Алдаа", "Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={["#1E1B4B", "#312E81", "#4338CA"]} style={styles.headerBackground}>
        <SafeAreaView>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Шинэ бүртгэл</Text>
            <Text style={styles.subtitle}>Байгууллагын мэдээллээ оруулна уу</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            
            {/* Байгууллагын хэсэг */}
            <View style={styles.sectionHeader}>
              <Building2 size={18} color="#6366F1" />
              <Text style={styles.sectionTitle}>Байгууллагын мэдээлэл</Text>
            </View>
            
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Байгууллагын нэр"
                value={formData.org_name}
                onChangeText={(text) => handleInputChange("org_name", text)}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Админ хэсэг */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <User size={18} color="#6366F1" />
              <Text style={styles.sectionTitle}>Админы мэдээлэл</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Овог"
                  value={formData.last_name}
                  onChangeText={(text) => handleInputChange("last_name", text)}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Нэр"
                  value={formData.first_name}
                  onChangeText={(text) => handleInputChange("first_name", text)}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Mail size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="И-мэйл хаяг"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Нууц үг"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94A3B8" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Нууц үг давтах"
                value={formData.repassword}
                onChangeText={(text) => handleInputChange("repassword", text)}
                secureTextEntry
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.9}>
              <LinearGradient colors={["#4338CA", "#6366F1"]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.button}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnInner}>
                    <Text style={styles.buttonText}>Бүртгэл үүсгэх</Text>
                    <ArrowRight size={18} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push("/login")} style={styles.footerLink}>
            <Text style={styles.footerText}>
              Бүртгэлтэй юу? <Text style={styles.footerBlue}>Нэвтрэх</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  flex: { flex: 1 },
  headerBackground: {
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 70,
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
  headerTextContainer: {
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#A5B4FC", marginTop: 4, fontWeight: "500" },
  scrollContent: { paddingHorizontal: 24, marginTop: -50, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#1E1B4B",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, marginLeft: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1E293B" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  button: { 
    padding: 16, 
    borderRadius: 14, 
    alignItems: "center", 
    marginTop: 10,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footerLink: { marginTop: 24, alignItems: "center" },
  footerText: { color: "#64748B", fontSize: 14 },
  footerBlue: { color: "#4338CA", fontWeight: "800" }
});