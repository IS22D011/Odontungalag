import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView 
} from "react-native";
import { useApp } from "../../contexts/AppContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { KeyRound, Mail, ChevronLeft, ArrowRight } from "lucide-react-native";

export default function VerifyOTPScreen() {
  const { verifyOTP } = useApp() as any;
  const router = useRouter();
  const { email } = useLocalSearchParams(); 
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 4) {
      Alert.alert("Алдаа", "Баталгаажуулах кодыг бүрэн оруулна уу.");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(email as string, code);
      setLoading(false);

      if (result.success) {
        Alert.alert(
          "Амжилттай", 
          "Таны бүртгэл баталгаажлаа. Одоо нэвтэрч болно.", 
          [{ text: "Нэвтрэх", onPress: () => router.replace("/login") }]
        );
      } else {
        Alert.alert("Алдаа", result.error);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Алдаа", "Системд алдаа гарлаа.");
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={["#1E1B4B", "#312E81", "#4338CA"]} style={styles.header}>
        <SafeAreaView>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Баталгаажуулалт</Text>
            <Text style={styles.subtitle}>Таны и-мэйл рүү код илгээлээ</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <KeyRound size={32} color="#6366F1" />
            </View>

            <Text style={styles.emailText}>
              <Mail size={14} color="#64748B" /> {email}
            </Text>
            
            <Text style={styles.instruction}>
              И-мэйл хаягт ирсэн 6 оронтой баталгаажуулах кодыг оруулна уу.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus={true}
              placeholderTextColor="#CBD5E1"
            />

            <TouchableOpacity onPress={handleVerify} disabled={loading} activeOpacity={0.9}>
              <LinearGradient 
                colors={["#4338CA", "#6366F1"]} 
                start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnInner}>
                    <Text style={styles.buttonText}>Баталгаажуулах</Text>
                    <ArrowRight size={18} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn}>
              <Text style={styles.resendText}>
                Код ирээгүй юу? <Text style={styles.resendLink}>Дахин илгээх</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  flex: { flex: 1 },
  header: {
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 80,
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
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#A5B4FC", marginTop: 4, fontWeight: "500" },
  content: { paddingHorizontal: 24, marginTop: -60 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 30,
    alignItems: "center",
    shadowColor: "#1E1B4B",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emailText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden'
  },
  instruction: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#F8FAFC",
    width: "100%",
    padding: 18,
    borderRadius: 16,
    fontSize: 32,
    letterSpacing: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#1E1B4B",
    fontWeight: "800",
  },
  button: { 
    width: 220,
    padding: 16, 
    borderRadius: 16, 
    alignItems: "center",
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resendBtn: { marginTop: 24 },
  resendText: { color: "#94A3B8", fontSize: 14 },
  resendLink: { color: "#4338CA", fontWeight: "700" }
});