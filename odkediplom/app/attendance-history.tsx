import { useApp } from "@/contexts/AppContext";
import { Attendance } from "@/types";
import { format } from "date-fns";
import { Stack, useRouter } from "expo-router";
import {
    Calendar,
    Camera,
    Clock,
    MapPin
} from "lucide-react-native";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

export default function AttendanceHistoryScreen() {
  const router = useRouter();
  const { todayAttendance } = useApp();

  const mockHistory: Attendance[] = [
    todayAttendance,
    {
      id: "att-2",
      userId: "user-1",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      checkIn: new Date(Date.now() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      checkOut: new Date(
        Date.now() - 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000,
      ),
      status: "present",
      method: "gps",
      location: {
        latitude: 47.9184,
        longitude: 106.9177,
        address: "Төв оффис",
      },
    },
    {
      id: "att-3",
      userId: "user-1",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      checkIn: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000,
      ),
      checkOut: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000 + 17.5 * 60 * 60 * 1000,
      ),
      status: "late",
      method: "qr",
      location: {
        latitude: 47.9184,
        longitude: 106.9177,
        address: "Төв оффис",
      },
    },
    {
      id: "att-4",
      userId: "user-1",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      checkIn: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000 + 8.5 * 60 * 60 * 1000,
      ),
      checkOut: new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000,
      ),
      status: "present",
      method: "gps",
      location: {
        latitude: 47.9184,
        longitude: 106.9177,
        address: "Төв оффис",
      },
    },
  ].filter(Boolean) as Attendance[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "#10B981";
      case "late":
        return "#F59E0B";
      case "on_leave":
        return "#3B82F6";
      case "absent":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "Ирсэн";
      case "late":
        return "Хоцорсон";
      case "on_leave":
        return "Чөлөөтэй";
      case "absent":
        return "Тасалсан";
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Ирцийн түүх",
          headerStyle: {
            backgroundColor: "#4F46E5",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "600" as const,
          },
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {mockHistory.map((attendance, index) => (
            <View key={attendance.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                  <Calendar size={18} color="#4F46E5" strokeWidth={2} />
                  <Text style={styles.dateText}>
                    {format(attendance.date, "yyyy-MM-dd")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(attendance.status) + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(attendance.status) },
                    ]}
                  >
                    {getStatusText(attendance.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.detailRow}>
                  <View style={styles.iconWrapper}>
                    <Clock size={16} color="#6B7280" strokeWidth={2} />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Ирсэн цаг</Text>
                    <Text style={styles.detailValue}>
                      {attendance.checkIn
                        ? format(attendance.checkIn, "HH:mm")
                        : "-"}
                    </Text>
                  </View>
                </View>

                {attendance.checkOut && (
                  <View style={styles.detailRow}>
                    <View style={styles.iconWrapper}>
                      <Clock size={16} color="#6B7280" strokeWidth={2} />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Гарсан цаг</Text>
                      <Text style={styles.detailValue}>
                        {format(attendance.checkOut, "HH:mm")}
                      </Text>
                    </View>
                  </View>
                )}

                {attendance.method && (
                  <View style={styles.detailRow}>
                    <View style={styles.iconWrapper}>
                      {attendance.method === "qr" ? (
                        <Camera size={16} color="#6B7280" strokeWidth={2} />
                      ) : (
                        <MapPin size={16} color="#6B7280" strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Бүртгэх арга</Text>
                      <Text style={styles.detailValue}>
                        {attendance.method === "qr" ? "QR код" : "GPS байршил"}
                      </Text>
                    </View>
                  </View>
                )}

                {attendance.location?.address && (
                  <View style={styles.detailRow}>
                    <View style={styles.iconWrapper}>
                      <MapPin size={16} color="#6B7280" strokeWidth={2} />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Байршил</Text>
                      <Text style={styles.detailValue}>
                        {attendance.location.address}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}

          {mockHistory.length === 0 && (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyStateText}>
                Ирцийн түүх байхгүй байна
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600" as const,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  cardContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500" as const,
    marginTop: 12,
  },
});
