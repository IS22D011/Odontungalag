import React, { useCallback, useState, useEffect } from "react";
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from "@nkzw/create-context-hook";
import * as ExpoLocation from 'expo-location';
import {
  Attendance,
  Conversation,
  TaskStatus,
} from "@/types";
import { conversations as initialConversations } from "@/mocks/messages";
import { documents as initialDocuments } from "@/mocks/documents";
import { stats as initialStats } from "@/mocks/attendance";

const BASE_URL = "http://192.168.144.53:8000/api";

export const [AppProvider, useApp] = createContextHook(() => {
  // ── СИСТЕМИЙН ТӨЛӨВ ──
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── ДАТА ТӨЛӨВ ──
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // ── МЭДЭГДЭЛ (notifications) ──
  const [notifications, setNotifications] = useState<any[]>([]);

  // ── ТОКЕН ШИНЭЧЛЭХ ──
  const refreshAccessToken = useCallback(async () => {
    const storedRefresh = await AsyncStorage.getItem("refreshToken");
    if (!storedRefresh) return null;
    try {
      const response = await fetch(`${BASE_URL}/users/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: storedRefresh }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem("accessToken", data.access);
        setToken(data.access);
        return data.access;
      }
      await logout();
      return null;
    } catch (e) { return null; }
  }, []);

  // ── МЭДЭГДЭЛ ТАТАХ ──
  const fetchNotifications = useCallback(async (accessToken: string, silent = false) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${BASE_URL}/notifications/`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) {
      if (!silent) console.error("Мэдэгдэл татахад алдаа:", e);
    }
  }, []);

  // ── МЭДЭГДЭЛ УНШСАН ТЭМДЭГЛЭХ ──
  const markNotificationRead = useCallback(async (id: number) => {
    if (!token) return;
    try {
      await fetch(`${BASE_URL}/notifications/${id}/mark_as_read/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (e) { console.error(e); }
  }, [token]);

  // ── СТАТИСТИК ТАТАХ ──
  const fetchStats = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/hr/my-stats/`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (response.ok) setStats(data);
    } catch (e) {
      console.error("Stats татахад алдаа:", e);
    }
  }, []);

  // ── ЧАТНЫ ӨРӨӨНҮҮД ТАТАХ ──
  const fetchConversations = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/chat/rooms/`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) fetchConversations(newToken);
      }
    } catch (e) {
      console.error("Чатны өрөөнүүд татахад алдаа:", e);
    }
  }, [refreshAccessToken]);

  // ── ӨӨРИЙН МЭДЭЭЛЭЛ ТАТАХ ──
  const fetchUserData = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/users/me/`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        const orgId = typeof userData.organization === 'object'
          ? userData.organization?.id
          : userData.organization;
        let orgDetails: any = null;
        if (orgId) {
          try {
            const orgRes = await fetch(`${BASE_URL}/organizations/my-org/`, {
              headers: { "Authorization": `Bearer ${accessToken}` },
            });
            if (orgRes.ok) orgDetails = await orgRes.json();
          } catch (e) {
            console.error("Байгууллага татахад алдаа:", e);
          }
        }
        const formattedUser = {
          ...userData,
          id: userData.id || userData.pk,
          organization_id: orgId,
          organization: orgDetails || userData.organization,
          organization_name: orgDetails?.name ?? userData.organization_name ?? "",
          organization_latitude: orgDetails?.latitude ?? userData.organization_latitude ?? null,
          organization_longitude: orgDetails?.longitude ?? userData.organization_longitude ?? null,
          organization_radius: orgDetails?.radius ?? userData.organization_radius ?? 100,
          name: userData.first_name || userData.username,
        };
        setUser(formattedUser);
        await AsyncStorage.setItem("userData", JSON.stringify(formattedUser));
      } else if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) fetchUserData(newToken);
      }
    } catch (e) {
      console.error("Хэрэглэгч татахад алдаа:", e);
    }
  }, [refreshAccessToken]);

  // ── БҮХ ХЭРЭГЛЭГЧ ТАТАХ ──
  const fetchAllUsers = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/users/`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (response.ok) setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (e) { console.error(e); }
  }, []);

  // ── ДААЛГАВАР ТАТАХ ──
  const fetchTasks = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/tasks/tasks/`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (response.ok) setTasks(Array.isArray(data) ? data : data.results || []);
    } catch (e) { console.error(e); }
  }, []);

  // ── БҮРТГҮҮЛЭХ ──
  const register = useCallback(async (userData: any) => {
    try {
      const response = await fetch(`${BASE_URL}/users/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.detail };
    } catch (e) { return { success: false, error: "Сервер алдаа." }; }
  }, []);

  // ── БАЙГУУЛЛАГА БҮРТГҮҮЛЭХ ──
  const registerOrganization = useCallback(async (orgData: any) => {
    try {
      const response = await fetch(`${BASE_URL}/users/register-org/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgData),
      });
      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.detail };
    } catch (e) { return { success: false, error: "Холболтын алдаа." }; }
  }, []);

  // ── ХЭРЭГЛЭГЧ ШИНЭЧЛЭХ (локал) ──
  const updateUser = useCallback(async (updatedData: any) => {
    try {
      const formattedUser = { ...user, ...updatedData };
      setUser(formattedUser);
      await AsyncStorage.setItem("userData", JSON.stringify(formattedUser));
    } catch (e) {
      console.error("Хэрэглэгч шинэчлэхэд алдаа:", e);
    }
  }, [user]);

  // ── OTP БАТАЛГААЖУУЛАХ ──
  const verifyOTP = useCallback(async (email: string, code: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      return response.ok ? { success: true } : { success: false };
    } catch (e) { return { success: false }; }
  }, []);

  // ── НЭВТРЭХ ──
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem("accessToken", data.access);
        setToken(data.access);
        await fetchUserData(data.access);
        await fetchConversations(data.access);
        await fetchNotifications(data.access);
        return { success: true };
      }
      return { success: false, error: data.detail };
    } catch (e) { return { success: false, error: "Сервер алдаа" }; }
  }, [fetchUserData, fetchConversations, fetchNotifications]);

  // ── ГАРАХ ──
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userData"]);
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setNotifications([]);
    } catch (e) { console.error(e); }
  }, []);

  // ── ГИШҮҮН УРИХ ──
  const inviteMember = useCallback(async (email: string, role: string, departmentId: number | null) => {
    if (!token) return { success: false };
    try {
      const response = await fetch(`${BASE_URL}/organizations/invite/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ email, role, department: departmentId }),
      });
      return response.ok ? { success: true } : { success: false };
    } catch (e) { return { success: false }; }
  }, [token]);

  // ── ТӨСӨЛ ҮҮСГЭХ ──
  const createProject = useCallback(async (projectData: any) => {
    if (!token) return { success: false };
    try {
      const response = await fetch(`${BASE_URL}/tasks/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(projectData),
      });
      const data = await response.json();
      if (response.ok) {
        setProjects(prev => [data, ...prev]);
        return { success: true, data };
      }
      return { success: false };
    } catch (e) { return { success: false }; }
  }, [token]);

  // ── ДААЛГАВАР ҮҮСГЭХ ──
  const createTask = useCallback(async (taskData: any) => {
    if (!token) return { success: false };
    try {
      const response = await fetch(`${BASE_URL}/tasks/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(taskData),
      });
      const data = await response.json();
      if (response.ok) {
        setTasks(prev => [...prev, data]);
        return { success: true, data };
      }
      return { success: false };
    } catch (e) { return { success: false }; }
  }, [token]);

  // ── ИРЦ БҮРТГЭЛ (GPS) ──
  const checkInWithLocation = useCallback(async (
    location: { latitude: number; longitude: number },
    method: string,
    type: 'IN' | 'OUT'
  ) => {
    if (!token) return { success: false, error: "Нэвтрэх шаардлагатай" };
    const payload = {
      method: method,
      status: type,
      lat: location.latitude,
      lng: location.longitude,
    };
    if (__DEV__) console.log("📤 check-in payload:", JSON.stringify(payload));
    try {
      const response = await fetch(`${BASE_URL}/hr/check-in/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (__DEV__) console.log("📥 check-in response:", response.status, JSON.stringify(data));
      if (response.ok) {
        setIsCheckedIn(type === 'IN');
        return { success: true, data };
      }
      return {
        success: false,
        status: response.status,
        error: data?.error || data?.detail || data?.message || JSON.stringify(data),
      };
    } catch (err) {
      return { success: false, error: "Сүлжээний алдаа гарлаа." };
    }
  }, [token]);

  // ── ИРЦ БҮРТГЭЛ (QR) ──
  const checkInWithQR = useCallback(async (qrPayload: string) => {
    if (!token) return { success: false, error: "Нэвтрэх шаардлагатай" };
    try {
      let attendanceStatus: 'IN' | 'OUT' = 'IN';
      try {
        const parsed = JSON.parse(qrPayload);
        if (parsed.m === 'IN' || parsed.m === 'OUT') attendanceStatus = parsed.m;
      } catch { }
      const payload = { method: 'qr', status: attendanceStatus, qr_payload: qrPayload };
      if (__DEV__) console.log("📤 QR check-in payload:", JSON.stringify(payload));
      const response = await fetch(`${BASE_URL}/hr/check-in/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (__DEV__) console.log("📥 QR check-in response:", response.status, JSON.stringify(data));
      if (response.ok) {
        setIsCheckedIn(attendanceStatus === 'IN');
        return { success: true, data };
      }
      return { success: false, error: data?.error || data?.detail || JSON.stringify(data) };
    } catch {
      return { success: false, error: "Системийн алдаа: Сервертэй холбогдож чадсангүй" };
    }
  }, [token]);

  // ── ХЭЛТЭС ҮҮСГЭХ ──
  const createDepartment = useCallback(async (name: string) => {
    if (!token) return { success: false, error: "Нэвтрэх шаардлагатай" };
    try {
      const response = await fetch(`${BASE_URL}/organizations/departments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (response.ok) {
        setDepartments(prev => [...prev, data]);
        return { success: true, data };
      }
      return { success: false, error: data.detail || "Алдаа гарлаа" };
    } catch (e) {
      return { success: false, error: "Холболтын алдаа" };
    }
  }, [token]);

  // ── ХЭЛТЭС ТАТАХ ──
  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${BASE_URL}/organizations/departments/`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setDepartments(data);
    } catch (e) { console.error("Хэлтэс татахад алдаа:", e); }
  }, [token]);

  // ── ТӨСӨЛД ГИШҮҮД НЭМЭХ ──
  const addMembersToProject = useCallback(async (projectId: string, members: number[]) => {
    if (!token) return { success: false, error: "Нэвтрэх шаардлагатай" };
    try {
      const response = await fetch(`${BASE_URL}/tasks/projects/${projectId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ members: members }),
      });
      const data = await response.json();
      if (response.ok) {
        setProjects(prev =>
          prev.map(p => String(p.id) === String(projectId) ? { ...p, members: members } : p)
        );
        return { success: true, data };
      }
      return { success: false, error: data.detail || "Хадгалахад алдаа гарлаа" };
    } catch (e) { return { success: false, error: "Сервер холболтын алдаа" }; }
  }, [token]);

  // ── ДААЛГАВАР ТӨЛӨВ ӨӨРЧЛӨХ ──
  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    if (!token) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const response = await fetch(`${BASE_URL}/tasks/tasks/${taskId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) fetchTasks(token);
    } catch (e) { fetchTasks(token); }
  }, [token, fetchTasks]);

  // ── МЕССЕЖ ИЛГЭЭХ ──
  const sendMessage = useCallback(async (
    roomId: string,
    text: string,
    setMessages: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    if (!text.trim() || !token || !user) return { success: false };
    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      text: text,
      sender_id: user.id,
      timestamp: new Date().toISOString(),
      sending: true,
    };
    setMessages(prev => [newMessage, ...prev]);
    try {
      const response = await fetch(`${BASE_URL}/chat/rooms/${roomId}/send_message/`, {
        method: 'POST',
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ text: text }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        fetchConversations(token);
        return { success: true };
      } else {
        throw new Error("Мессеж илгээхэд алдаа");
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert("Алдаа", "Мессеж илгээж чадсангүй.");
      return { success: false };
    }
  }, [token, user, fetchConversations]);

  // ── БАЙГУУЛЛАГА ЗАСАХ ──
  const updateOrganization = useCallback(async (orgData: any) => {
    if (!token) return { success: false, error: "Нэвтрэх шаардлагатай" };
    try {
      const response = await fetch(`${BASE_URL}/organizations/update-org/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(orgData),
      });
      const data = await response.json();
      if (response.ok) {
        const updatedUser = {
          ...user,
          organization: {
            ...(typeof user?.organization === 'object' ? user.organization : {}),
            name: data.data?.name ?? orgData.name,
            latitude: data.data?.latitude ?? orgData.latitude,
            longitude: data.data?.longitude ?? orgData.longitude,
            radius: data.data?.radius ?? orgData.radius,
          },
          organization_name: data.data?.name ?? orgData.name,
          organization_latitude: data.data?.latitude ?? orgData.latitude,
          organization_longitude: data.data?.longitude ?? orgData.longitude,
          organization_radius: data.data?.radius ?? orgData.radius,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
        return { success: true };
      }
      return { success: false, error: data.detail || "Хадгалахад алдаа гарлаа" };
    } catch (e) { return { success: false, error: "Сервер холболтын алдаа" }; }
  }, [token, user]);

  // ── ИРЦИЙН ТӨЛӨВ ШАЛГАХ ──
  const checkAttendanceStatus = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/hr/my-attendance/`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localToday = new Date(now.getTime() - offset).toISOString().split('T')[0];
        const todayLogs = data.filter((log: any) => {
          const rawDate = log?.check_in || log?.created_at || log?.timestamp;
          return rawDate && rawDate.split('T')[0] === localToday;
        });
        setTodayAttendance(todayLogs);
        const hasIn = todayLogs.some((log: any) => log.status === 'IN');
        const hasOut = todayLogs.some((log: any) => log.status === 'OUT');
        setIsCheckedIn(hasIn && !hasOut);
      }
    } catch (err) {
      console.error("Attendance check error:", err);
    }
  }, []);

  // ── АПП ЭХЛЭХЭД ДАТА АЧААЛАХ ──
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [sToken, sRefresh, sUser] = await Promise.all([
          AsyncStorage.getItem("accessToken"),
          AsyncStorage.getItem("refreshToken"),
          AsyncStorage.getItem("userData"),
        ]);

        if (sToken && sUser) {
          setToken(sToken);
          setRefreshToken(sRefresh);
          setUser(JSON.parse(sUser));

          await Promise.all([
            fetchUserData(sToken),
            fetchTasks(sToken),
            fetchAllUsers(sToken),
            fetchConversations(sToken),
            checkAttendanceStatus(sToken),
            fetchStats(sToken),
            fetchNotifications(sToken),
          ]);

          const deptResponse = await fetch(`${BASE_URL}/organizations/departments/`, {
            headers: { "Authorization": `Bearer ${sToken}` },
          });
          const deptData = await deptResponse.json();
          if (deptResponse.ok) setDepartments(deptData);
        }
      } catch (e) {
        console.error("Дата ачаалахад алдаа:", e);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    loadStoredData();
  }, []);

  // ── РЕАЛ-ТАЙМ: 30 секунд тутам мэдэгдэл шалгах ──
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchNotifications(token, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [token, fetchNotifications]);

  return {
    user, token, isLoading, projects, tasks, users, conversations, stats,
    notifications, documents: initialDocuments, todayAttendance, isCheckedIn,
    login, logout, register, registerOrganization, verifyOTP,
    fetchUserData, fetchAllUsers, fetchTasks, updateOrganization,
    inviteMember, createProject, createTask, moveTask, sendMessage,
    checkInWithLocation, checkInWithQR, departments, fetchDepartments,
    createDepartment, addMembersToProject, setProjects, setTasks,
    fetchConversations, BASE_URL, updateUser, fetchStats,
    fetchNotifications, markNotificationRead,
    checkAttendanceStatus,
  };
});
