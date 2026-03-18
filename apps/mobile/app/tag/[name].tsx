import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useClips } from "@/lib/hooks";
import { ClipCard } from "@/components/ClipCard";
import { Ionicons } from "@expo/vector-icons";
import type { Clip } from "@clipnotes/shared";

export default function TagDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useClips({ tag: name });

  const clips = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <View style={s.container}>
      <Stack.Screen
        options={{
          title: `#${name}`,
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#fff",
        }}
      />

      <View style={s.header}>
        <Ionicons name="pricetag" size={20} color="#6366f1" />
        <Text style={s.headerTag}>#{name}</Text>
        <Text style={s.headerCount}>
          {clips.length} clip{clips.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={clips}
        keyExtractor={(item: Clip) => item.id}
        renderItem={({ item }) => <ClipCard clip={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>No clips with this tag</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#16213e",
  },
  headerTag: { color: "#fff", fontSize: 18, fontWeight: "600" },
  headerCount: { color: "#888", fontSize: 14, marginLeft: "auto" },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyText: { color: "#888" },
});
