import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./contexts/AuthContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" options={{ headerShown: true, headerStyle: { backgroundColor: "#0f0f1a" }, headerTintColor: "#fff" }} />
          <Stack.Screen name="profile/[id]" options={{ headerShown: true, headerStyle: { backgroundColor: "#0f0f1a" }, headerTintColor: "#fff", title: "الملف الشخصي" }} />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
