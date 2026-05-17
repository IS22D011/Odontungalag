import { VALID_QR_CODES } from "@/constants/attendance";
import { useApp } from "@/contexts/AppContext";
import { BarcodeScanningResult, Camera, CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import { ScanLine, XCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AttendanceQRScreen() {
  const router = useRouter();
  const { checkInWithQR } = useApp();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === "web") {
      setHasPermission(false);
      Alert.alert(
        "Камер дэмжигдэхгүй",
        "Web дээр QR код уншуулах боломжгүй байна. Байршлаар бүртгүүлнэ үү.",
        [{ text: "Ойлголоо", onPress: () => router.back() }],
      );
      return;
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");

    if (status !== "granted") {
      Alert.alert(
        "Камерын эрх шаардлагатай",
        "QR код уншуулахын тулд камерын эрх олгоно уу",
        [{ text: "Буцах", onPress: () => router.back() }],
      );
    }
  };

const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;

    setScanned(true);
    setScanning(false);

    // Haptics ажиллуулах (Уншсаныг мэдэгдэх)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // AppContext-д байгаа checkInWithQR-г дуудна
      const result = await checkInWithQR(data);

      if (result.success) {
        router.replace("/attendance-success");
      } else {
        // Серверээс алдаа ирвэл (Буруу QR, хугацаа дууссан г.м)
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Бүртгэл амжилтгүй",
          result.error || "QR код буруу байна",
          [
            {
              text: "Дахин оролдох",
              onPress: () => {
                setScanned(false);
                setScanning(true);
              },
            },
            { text: "Буцах", onPress: () => router.back() },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Алдаа", "Системд алдаа гарлаа. Дахин оролдоно уу.");
      setScanned(false);
      setScanning(true);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "QR код уншуулах",
            headerStyle: {
              backgroundColor: "#7C3AED",
            },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: {
              fontWeight: "600" as const,
            },
          }}
        />
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>Камер ачаалж байна...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "QR код уншуулах",
            headerStyle: {
              backgroundColor: "#7C3AED",
            },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: {
              fontWeight: "600" as const,
            },
          }}
        />
        <View style={styles.messageContainer}>
          <View style={[styles.iconContainer, { backgroundColor: "#FEF3C7" }]}>
            <XCircle size={64} color="#F59E0B" strokeWidth={2} />
          </View>
          <Text style={styles.errorTitle}>Камерын эрх шаардлагатай</Text>
          <Text style={styles.errorSubtitle}>
            QR код уншуулахын тулд камерын эрх олгоно уу
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={requestCameraPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Эрх олгох</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "QR код уншуулах",
          headerStyle: {
            backgroundColor: "#7C3AED",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "600" as const,
          },
        }}
      />

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />

        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {scanning && (
                <View style={styles.scanLineContainer}>
                  <ScanLine size={240} color="#FFFFFF" strokeWidth={2} />
                </View>
              )}
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                Оффис дээр байршуулсан QR кодыг уншуулна уу
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  middleRow: {
    flexDirection: "row",
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FFFFFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLineContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -120,
    marginTop: -12,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  instructionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  messageText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
});
