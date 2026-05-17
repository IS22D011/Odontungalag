import { Tabs } from "expo-router";
import {
  CheckSquare,
  FileText,
  Home,
  MessageCircle,
  User,
  UsersRound,
  PlusSquare,
  UserPlus,
  ClipboardList, // Ирцэд зориулсан икон
} from "lucide-react-native";
import React from "react";
import { useApp } from "../../contexts/AppContext";

export default function TabLayout() {
  const { user } = useApp();
  
  // Админ эсвэл Менежер эсэхийг шалгах
  const isAdmin = user?.role === "admin";
  const isAuthorized = user?.role === "admin" || user?.role === "manager";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Нүүр",
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Даалгавар",
          tabBarIcon: ({ color, size }) => (
            <CheckSquare size={size} color={color} strokeWidth={2.5} />
          ),
          headerTitle: "Миний даалгавар",
          headerShown: true,
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Чат",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} strokeWidth={2.5} />
          ),
          headerTitle: "Чат",
          headerShown: true,
        }}
      />

      {/* ШИНЭ: Ирц хэсэг (Зөвхөн Admin болон Manager харна) */}
      <Tabs.Screen
        name="irts"
        options={{
          title: "Ирц",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList size={size} color={color} strokeWidth={2.5} />
          ),
          href: isAuthorized ? "/irts" : null, // Зөвхөн эрхтэй бол харагдана
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Профайл",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} strokeWidth={2.5} />
          ),
        }}
      />      
      
      <Tabs.Screen
        name="OrganizationManagementScreen"
        options={{
          tabBarIcon: ({ color, size }) => (
            <UsersRound size={size} color={color} strokeWidth={2.5} />
          ),
          tabBarLabel: () => null,
          href: isAdmin ? "/OrganizationManagementScreen" : null,
        }}
      />

      {/* Бусад нуугдсан хуудсууд */}
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="CreateTeamScreen" options={{ href: null }} />
      <Tabs.Screen name="InviteMemberScreen" options={{ href: null }} />
      <Tabs.Screen name="CreateDepartmentScreen" options={{ href: null }} />
      <Tabs.Screen name="ManageMembersScreen" options={{ href: null }} />
      <Tabs.Screen name="CreateTaskScreen" options={{ href: null }} />
      <Tabs.Screen name="CreateProjectScreen" options={{ href: null }} />
      <Tabs.Screen name="ProjectsScreen" options={{ href: null }} />
      <Tabs.Screen name="MemberTasksScreen" options={{ href: null }} />
      <Tabs.Screen name="ProjectDetailScreen" options={{ href: null }} />
      <Tabs.Screen name="SelectProjectMembersScreen" options={{ href: null }} />
      <Tabs.Screen name="EditOrganizationScreen" options={{ href: null }} />
      <Tabs.Screen name="RegisterDisplayScreen" options={{ href: null }} />
      <Tabs.Screen name="editProfile" options={{ href: null }} />
      <Tabs.Screen name="ProjectStatusScreen" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="TaskDetailScreen" options={{ href: null }} />
      <Tabs.Screen name="CreateLeaveScreen" options={{ href: null }} />
      <Tabs.Screen name="AttendanceListScreen" options={{ href: null }} />
    </Tabs>
  );
}