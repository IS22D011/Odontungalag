import { LATE_CHECK_IN_TIME, OFFICE_LOCATION } from "@/constants/attendance";
import { attendanceHistory, stats as initialStats } from "@/mocks/attendance";
import { documents as initialDocuments } from "@/mocks/documents";
import { conversations as initialConversations } from "@/mocks/messages";
import { projects } from "@/mocks/projects";
import { tasks as initialTasks } from "@/mocks/tasks";
import { currentUser } from "@/mocks/users";
import {
  Attendance,
  AttendanceMethod,
  Conversation,
  Task,
  TaskStatus,
  UserRole, // шинэ enum эсвэл type
} from "@/types";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useState } from "react";

// 🌟 Эрх шалгах функц
export const hasPermission = (
  user: typeof currentUser | null,
  allowedRoles: UserRole[],
): boolean => {
  if (!user) return false;
  return allowedRoles.includes(user.role);
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [todayAttendance, setTodayAttendance] = useState<
    Attendance | undefined
  >(attendanceHistory[0]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );
  }, []);

  // ✅ Role-based check for Check-in
  const checkIn = useCallback(async () => {
    if (!hasPermission(currentUser, ["employee", "manager", "admin"])) {
      alert("Та ирц бүртгэх эрхгүй байна");
      return;
    }

    const now = new Date();
    const newAttendance: Attendance = {
      id: `att-${Date.now()}`,
      userId: currentUser.id,
      date: now,
      checkIn: now,
      status: "present",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    };
    setTodayAttendance(newAttendance);
    setIsCheckedIn(true);
  }, []);

  const checkInWithLocation = useCallback(
    async (
      location: { latitude: number; longitude: number },
      method: AttendanceMethod,
    ) => {
      if (!hasPermission(currentUser, ["employee", "manager", "admin"])) {
        alert("Та GPS-ээр ирц бүртгэх эрхгүй байна");
        return;
      }

      const now = new Date();
      const hour = now.getHours();
      const status: Attendance["status"] =
        hour >= LATE_CHECK_IN_TIME ? "late" : "present";

      const newAttendance: Attendance = {
        id: `att-${Date.now()}`,
        userId: currentUser.id,
        date: now,
        checkIn: now,
        status,
        method,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: OFFICE_LOCATION.name,
        },
      };
      setTodayAttendance(newAttendance);
      setIsCheckedIn(true);
    },
    [],
  );

  const checkInWithQR = useCallback(async (qrCodeId: string) => {
    if (!hasPermission(currentUser, ["employee", "manager", "admin"])) {
      alert("Та QR-ээр ирц бүртгэх эрхгүй байна");
      return;
    }

    const now = new Date();
    const hour = now.getHours();
    const status: Attendance["status"] =
      hour >= LATE_CHECK_IN_TIME ? "late" : "present";

    const newAttendance: Attendance = {
      id: `att-${Date.now()}`,
      userId: currentUser.id,
      date: now,
      checkIn: now,
      status,
      method: "qr",
      qrCodeId,
      location: {
        latitude: OFFICE_LOCATION.latitude,
        longitude: OFFICE_LOCATION.longitude,
        address: OFFICE_LOCATION.name,
      },
    };
    setTodayAttendance(newAttendance);
    setIsCheckedIn(true);
  }, []);

  const checkOut = useCallback(async () => {
    if (!hasPermission(currentUser, ["employee", "manager", "admin"])) {
      alert("Та гарах бүртгэл хийх эрхгүй байна");
      return;
    }

    if (todayAttendance) {
      setTodayAttendance({
        ...todayAttendance,
        checkOut: new Date(),
      });
    }
    setIsCheckedIn(false);
  }, [todayAttendance]);

  const markConversationAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
      ),
    );
  }, []);

  return {
    user: currentUser,
    tasks,
    projects,
    conversations,
    documents: initialDocuments,
    todayAttendance,
    isCheckedIn,
    stats: initialStats,
    moveTask,
    checkIn,
    checkInWithLocation,
    checkInWithQR,
    checkOut,
    markConversationAsRead,
    hasPermission, // context-оор дамжуулах
  };
});
