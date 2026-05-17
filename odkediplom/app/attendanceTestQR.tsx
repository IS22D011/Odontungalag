// app/AttendanceTestQR.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function AttendanceTestQR() {
  const testCodes = [
    "OFFICE_QR_2024_MAIN",
    "OFFICE_QR_2024_ENTRANCE",
    "OFFICE_QR_2024_LOBBY",
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Туршилтын QR код</Text>
      {testCodes.map((code, index) => (
        <View key={index} style={styles.qrContainer}>
          <QRCode value={code} size={200} />
          <Text style={styles.qrLabel}>{code}</Text>
        </View>
      ))}
      <Text style={styles.subtitle}>
        Камераа нээгээд энэхүү QR кодыг уншуулна уу
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 16,
  },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 24 },
  qrContainer: {
    marginBottom: 24,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  qrLabel: { marginTop: 8, fontSize: 14, color: "#6B7280" },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
  },
});
