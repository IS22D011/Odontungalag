import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator, StyleSheet, Text, TouchableOpacity,
  View, ScrollView, Platform, Modal,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, MapPin, Navigation, XCircle, AlertCircle } from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";

type VerificationState = "checking" | "valid" | "invalid" | "error" | "permission";

// ── Платформ хамааралгүй Custom Modal ─────────────────────────────────────────
function CustomAlert({
  visible,
  title,
  message,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={alertStyles.overlay}>
        <View style={alertStyles.box}>
          <Text style={alertStyles.title}>{title}</Text>
          <Text style={alertStyles.message}>{message}</Text>
          <TouchableOpacity style={alertStyles.button} onPress={onClose}>
            <Text style={alertStyles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Үндсэн дэлгэц ──────────────────────────────────────────────────────────────
export default function AttendanceGPSScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'IN' | 'OUT' }>();
  const { checkInWithLocation, user } = useApp() as any;

  const isOut = type === 'OUT';

  const [state, setState] = useState<VerificationState>("checking");
  const [distance, setDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom modal төлөв
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertGoBack, setAlertGoBack] = useState(false);

  const showAlert = (title: string, message: string, goBack = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertGoBack(goBack);
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertGoBack) router.back();
  };

  const OFFICE = useMemo(() => {
    const lat = parseFloat(user?.organization_latitude ?? user?.organization?.latitude ?? "");
    const lng = parseFloat(user?.organization_longitude ?? user?.organization?.longitude ?? "");
    const radius = parseInt(user?.organization_radius ?? user?.organization?.radius ?? "100");
    const name = user?.organization_name || user?.organization?.name || "Төв оффис";

    if (__DEV__) {
      console.log("🏢 OFFICE config:", { lat, lng, radius, name });
      console.log("👤 user.organization:", user?.organization);
    }

    return {
      latitude: isNaN(lat) ? null : lat,
      longitude: isNaN(lng) ? null : lng,
      radius: isNaN(radius) ? 100 : radius,
      name,
    };
  }, [user]);

  const isOfficeConfigured = useMemo(() =>
    OFFICE.latitude !== null && OFFICE.longitude !== null,
  [OFFICE]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const verifyLocation = useCallback(async () => {
    setState("checking");
    setErrorMessage("");

    if (!isOfficeConfigured) {
      setState("error");
      setErrorMessage("Байгууллагын байршил тохируулагдаагүй байна. Админтай холбогдоно уу.");
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState("permission");
        setErrorMessage("Байршил тогтоох эрх олгоно уу.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      const dist = calculateDistance(
        latitude, longitude,
        OFFICE.latitude!, OFFICE.longitude!
      );
      const roundedDist = Math.round(dist);
      setDistance(roundedDist);

      if (dist <= OFFICE.radius) {
        setState("valid");
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setState("invalid");
        setErrorMessage(`Та оффисоос ${roundedDist}м зайтай байна. Зөвшөөрөгдсөн: ${OFFICE.radius}м`);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setState("error");
      setErrorMessage("GPS дохио авч чадсангүй. Дахин оролдоно уу.");
    }
  }, [OFFICE, isOfficeConfigured]);

  useEffect(() => {
    verifyLocation();
  }, [verifyLocation]);

  const handleCheckIn = async () => {
    if (!userLocation || isSubmitting || state !== "valid") return;
    setIsSubmitting(true);

    try {
      const res = await checkInWithLocation(userLocation, "gps", type || "IN");

      if (res.success) {
        if (Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        router.replace("/attendance-success");
      } else {
        const errMsg = res.error || "Алдаа гарлаа.";
        if (__DEV__) console.log("❌ check-in алдаа:", errMsg);
        // ✅ Alert.alert биш — custom Modal (web + mobile хоёуланд ажиллана)
        showAlert("Мэдэгдэл", errMsg, true);
      }
    } catch {
      showAlert("Алдаа", "Хүсэлт илгээхэд алдаа гарлаа.", false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stateIcon = () => {
    switch (state) {
      case "checking":
        return <ActivityIndicator size="large" color="#4F46E5" />;
      case "valid":
        return <CheckCircle2 size={48} color="#10B981" />;
      default:
        return <XCircle size={48} color="#EF4444" />;
    }
  };

  const stateTitle = () => {
    switch (state) {
      case "checking":    return "Байршил шалгаж байна...";
      case "valid":       return "Байршил баталгаажлаа";
      case "permission":  return "Байршилын эрх шаардлагатай";
      case "error":       return "Алдаа гарлаа";
      default:            return "Байршил таарахгүй байна";
    }
  };

  return (
    <>
      {/* ── Custom Alert Modal ── */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={handleAlertClose}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Stack.Screen options={{
          title: isOut ? "Гарах ирц" : "Орох ирц",
          headerStyle: { backgroundColor: "#4F46E5" },
          headerTintColor: "#fff",
        }} />

        <View style={styles.statusCard}>
          <View style={[
            styles.iconBox,
            state === "valid" ? styles.bgSuccess : styles.bgNeutral
          ]}>
            {stateIcon()}
          </View>

          <Text style={styles.title}>{stateTitle()}</Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <MapPin size={18} color="#6B7280" />
              <Text style={styles.infoLabel}>Оффис:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{OFFICE.name}</Text>
            </View>

            {isOfficeConfigured ? (
              <View style={styles.infoRow}>
                <Navigation size={18} color="#6B7280" />
                <Text style={styles.infoLabel}>Зай:</Text>
                <Text style={[
                  styles.infoValue,
                  state === "invalid" && { color: "#EF4444" },
                  state === "valid" && { color: "#10B981" },
                ]}>
                  {distance !== null ? `${distance}м` : "—"}
                </Text>
              </View>
            ) : (
              <View style={styles.warningRow}>
                <AlertCircle size={16} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Байгууллагын байршил тохируулагдаагүй байна
                </Text>
              </View>
            )}

            {__DEV__ && isOfficeConfigured && (
              <Text style={styles.debugText}>
                Office: {OFFICE.latitude!.toFixed(4)}, {OFFICE.longitude!.toFixed(4)} | r: {OFFICE.radius}м
              </Text>
            )}

            {(state === "invalid" || state === "error" || state === "permission") && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </View>

          {state === "valid" && (
            <TouchableOpacity
              style={[styles.mainButton, isSubmitting && { opacity: 0.7 }]}
              onPress={handleCheckIn}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isOut ? ["#F59E0B", "#D97706"] : ["#4F46E5", "#3730A3"]}
                style={styles.gradient}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>
                      {isOut ? "ГАРАХ БҮРТГЭХ" : "ОРОХ БҮРТГЭХ"}
                    </Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.secondaryButton, state === "checking" && { opacity: 0.5 }]}
            onPress={verifyLocation}
            disabled={state === "checking"}
          >
            <Text style={styles.secondaryButtonText}>↻ Дахин шалгах</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

// ── Custom Alert Styles ────────────────────────────────────────────────────────
const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

// ── Main Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContent: { padding: 20, alignItems: "center", paddingTop: 40 },
  statusCard: {
    width: "100%", backgroundColor: "#fff", borderRadius: 24, padding: 24,
    alignItems: "center", elevation: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  iconBox: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  bgSuccess: { backgroundColor: "#D1FAE5" },
  bgNeutral: { backgroundColor: "#F3F4F6" },
  title: {
    fontSize: 20, fontWeight: "800", color: "#111827",
    marginBottom: 24, textAlign: "center",
  },
  infoBox: {
    width: "100%", backgroundColor: "#F9FAFB",
    borderRadius: 16, padding: 16, marginBottom: 24, gap: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoLabel: { flex: 1, marginLeft: 10, color: "#6B7280", fontSize: 14 },
  infoValue: { fontWeight: "700", color: "#111827", fontSize: 14, maxWidth: "50%" },
  warningRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEF3C7", borderRadius: 10, padding: 10,
  },
  warningText: { color: "#92400E", fontSize: 13, flex: 1 },
  errorBox: { backgroundColor: "#FEF2F2", borderRadius: 10, padding: 10 },
  errorText: { color: "#EF4444", fontSize: 13 },
  debugText: {
    fontSize: 10, color: "#9CA3AF",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  mainButton: { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  gradient: { paddingVertical: 18, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16, letterSpacing: 1 },
  secondaryButton: { padding: 12 },
  secondaryButtonText: { color: "#4F46E5", fontWeight: "600" },
});
