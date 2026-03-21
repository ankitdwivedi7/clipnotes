import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { setTokenGetter } from "@/lib/api";
import { registerForPushNotifications } from "@/lib/notifications";
import SignIn from "./(auth)/sign-in";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "clipnotes-query-cache",
});

function AuthTokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

function PushNotificationSetup() {
  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) console.log("[Push] Expo push token:", token);
    });
  }, []);
  return null;
}

function AppContent() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={s.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return <SignIn />;
  }

  return (
    <>
      <AuthTokenSync />
      <PushNotificationSetup />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#0f0f23" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="ingest" options={{ headerShown: false }} />
        <Stack.Screen name="clip/[id]" options={{ title: "Clip Detail" }} />
        <Stack.Screen name="tag/[name]" options={{ title: "Tag" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <AppContent />
        </PersistQueryClientProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#999", marginTop: 12 },
});
