import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Dimensions, SafeAreaView 
} from "react-native";
import { useApp } from "../../contexts/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Mail, Lock, ChevronRight } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Алдаа", "Мэдээллээ бүрэн бөглөнө үү.");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert("Нэвтрэхэд алдаа", result.error);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* Дээд талын Indigo Gradient хэсэг - HomeScreen-тэй ижил өнгө */}
      <LinearGradient colors={["#1E1B4B", "#312E81", "#4338CA"]} style={styles.topShape}>
        <SafeAreaView style={styles.headerContent}>
          <Text style={styles.brandName}>ERP SYSTEM</Text>
          <Text style={styles.welcomeText}>Тавтай морилно уу</Text>
          <Text style={styles.subtitle}>Системд нэвтэрч ирцээ бүртгүүлнэ үү</Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.formContainer}
      >
        <View style={styles.card}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>И-мэйл хаяг</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="И-мэйл"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Нууц үг</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
            <LinearGradient 
              colors={["#4338CA", "#6366F1"]} 
              start={{x: 0, y: 0}} 
              end={{x: 1, y: 1}} 
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Нэвтрэх</Text>
                  <ChevronRight size={20} color="#fff" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <TouchableOpacity 
          style={styles.registerBtn} 
          onPress={() => router.push("/register")}
        >
          <Text style={styles.registerText}>
            Шинэ хэрэглэгч үү? <Text style={styles.registerAccent}>Бүртгүүлэх</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  topShape: {
    height: Platform.OS === 'ios' ? 280 : 240,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 30,
    justifyContent: "center",
  },
  headerContent: {
    marginTop: -20,
  },
  brandName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  welcomeText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#A5B4FC",
    fontSize: 15,
    marginTop: 5,
    fontWeight: "500",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -50, // Карт дээшээ Gradient дээр давхарлаж харагдана
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#1E1B4B",
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1E293B",
  },
  button: {
    borderRadius: 16,
    marginTop: 10,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  registerBtn: {
    marginTop: 30,
    alignItems: "center",
  },
  registerText: {
    color: "#64748B",
    fontSize: 14,
  },
  registerAccent: {
    color: "#4338CA",
    fontWeight: "700",
  },
});