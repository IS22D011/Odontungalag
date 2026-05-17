// app/(display)/_layout.tsx
import { Stack } from 'expo-router';

export default function DisplayLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} /> // Бүх толгой цэсийг нууна
  );
}