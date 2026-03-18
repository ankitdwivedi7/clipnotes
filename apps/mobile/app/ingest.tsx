import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { setPendingIngestUrl } from "@/lib/deep-link-store";

/**
 * Hidden route that handles clipnotes://ingest?url=...
 * Expo Router navigates here on deep link; we stash the URL
 * in a module-level store and redirect to the inbox.
 */
export default function IngestRedirect() {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url?: string }>();

  useEffect(() => {
    if (url) {
      setPendingIngestUrl(decodeURIComponent(url));
    }
    router.replace("/(tabs)");
  }, [url, router]);

  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
});
