import { useApp } from "@/contexts/AppContext";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import {
    Calendar,
    Camera,
    CheckCircle2,
    Clock,
    MapPin,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AttendanceSuccessScreen() {
  const router = useRouter();
  const { todayAttendance } = useApp();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient colors={["#10B981", "#059669"]} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={80} color="#FFFFFF" strokeWidth={2.5} />
          </View>

          <Text style={styles.title}>Ирц амжилттай бүртгэгдлээ</Text>
          <Text style={styles.subtitle}>
            Таны ирц амжилттай бүртгэгдлээ. Өнөөдөр сайхан өнгөрүүлээрэй!
          </Text>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Ирцийн мэдээлэл</Text>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={20} color="#10B981" strokeWidth={2} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Огноо</Text>
                <Text style={styles.detailValue}>
                  {todayAttendance?.date
                    ? format(todayAttendance.date, "yyyy-MM-dd")
                    : "-"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={20} color="#10B981" strokeWidth={2} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Ирсэн цаг</Text>
                <Text style={styles.detailValue}>
                  {todayAttendance?.checkIn
                    ? format(todayAttendance.checkIn, "HH:mm")
                    : "-"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                {todayAttendance?.method === "qr" ? (
                  <Camera size={20} color="#10B981" strokeWidth={2} />
                ) : (
                  <MapPin size={20} color="#10B981" strokeWidth={2} />
                )}
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Бүртгэх арга</Text>
                <Text style={styles.detailValue}>
                  {todayAttendance?.method === "qr" ? "QR код" : "GPS байршил"}
                </Text>
              </View>
            </View>

            {todayAttendance?.location && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MapPin size={20} color="#10B981" strokeWidth={2} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Байршил</Text>
                  <Text style={styles.detailValue}>
                    {todayAttendance.location.address || "Төв оффис"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Дууслаа</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  successIcon: {
    alignSelf: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600" as const,
  },
  doneButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  doneButtonText: {
    fontSize: 18,
    color: "#10B981",
    fontWeight: "700" as const,
  },
});
