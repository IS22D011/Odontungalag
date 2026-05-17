import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { Camera, MapPin, Shield, ChevronLeft } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Platform
} from "react-native";

export default function AttendanceMethodScreen() {
  const router = useRouter();

  const handleGoHome = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace("/"); 
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header-ийг нуух (Custom Header ашиглах тул) */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 2. Custom Back Button - Энэ хэсэг ВЭБ дээр заавал харагдана */}
      <View style={styles.customHeader}>
        <TouchableOpacity 
          onPress={handleGoHome} 
          style={styles.backButton}
        >
          <ChevronLeft size={28} color="#1F2937" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.shieldIconContainer}>
            <Shield size={40} color="#6366F1" strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Ирц бүртгүүлэх аргыг сонгоно уу</Text>
          <Text style={styles.subtitle}>
            Та байршил эсвэл QR кодоор ирцээ{"\n"}бүртгүүлэх боломжтой
          </Text>
        </View>

        <View style={styles.methodsContainer}>
          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => router.push("/attendance-gps")}
          >
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.methodGradient}>
              <View style={styles.methodIconCircle}><MapPin size={32} color="#FFFFFF" /></View>
              <Text style={styles.methodTitle}>Байршлаар бүртгүүлэх</Text>
              <Text style={styles.methodDescription}>Таны байршлыг шалгаж ирцийг автоматаар бүртгэнэ</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.methodCard}
            onPress={() => router.push("/attendance-qr")}
          >
            <LinearGradient colors={["#A855F7", "#7C3AED"]} style={styles.methodGradient}>
              <View style={styles.methodIconCircle}><Camera size={32} color="#FFFFFF" /></View>
              <Text style={styles.methodTitle}>QR-ээр бүртгүүлэх</Text>
              <Text style={styles.methodDescription}>Оффис дээр байршуулсан QR кодыг уншуулна уу</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.securityNotice}>
          <Shield size={14} color="#9CA3AF" />
          <Text style={styles.securityText}>Ирцийн мэдээлэл аюулгүйгээр бүртгэгдэнэ</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Вэб дээр илүү цэвэрхэн харагдах үүднээс
  },
  customHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    // Вэб дээр header-ийг дээд талд нь барих
    ...Platform.select({
      web: {
        paddingTop: 10,
      }
    })
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6', // Вэб дээр товчлуур гэдэг нь тодорхой харагдах зай
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 500, // Вэб дээр хэтэрхий өргөн болохоос сэргийлнэ
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  shieldIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  methodsContainer: {
    gap: 20,
  },
  methodCard: {
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  methodGradient: {
    padding: 32,
    alignItems: "center",
  },
  methodIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  methodTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 20,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 40,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
  },
  securityText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
});