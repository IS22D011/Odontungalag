import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from "../contexts/AppContext";

// Splash screen-ийг автоматаар нуухгүй байх
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading, token, user } = useApp() as any; // user дотор role байгаа гэж үзэв
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const handleNavigation = async () => {
      if (isLoading) return;

      // Дата ачаалж дууссан бол Splash screen-ийг нууна
      await SplashScreen.hideAsync();

      const inAuthGroup = segments[0] === "(auth)";
      const inDisplayGroup = segments[0] === "(display)";
      const inTabsGroup = segments[0] === "(tabs)";

      // 1. Хэрэв нэвтрээгүй бол заавал нэвтрэх хуудас руу
      if (!token) {
        if (!inAuthGroup) {
          router.replace("/(auth)/login");
        }
        return;
      }

      // 2. Хэрэв нэвтэрсэн бол Ролиос нь хамаарч чиглүүлнэ
      if (token) {
        // DISPLAY ROLE (Үүдний дэлгэц)
        if (user?.role === 'display') {
          if (!inDisplayGroup) {
            router.replace("/(display)/kiosk");
          }
        } 
        // АДМИН ЭСВЭЛ АЖИЛТАН
        else {
          if (inAuthGroup || inDisplayGroup) {
            router.replace("/(tabs)");
          }
        }
      }
    };

    handleNavigation();
  }, [token, isLoading, segments, user?.role]);

  // Ачаалж байх үед харагдах spinner
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
});