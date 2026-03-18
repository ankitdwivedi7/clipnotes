import { useState, useCallback, useRef } from "react";
import { View, Text, TextInput, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearch } from "@/lib/hooks";
import { ClipCard } from "@/components/ClipCard";
import type { Clip } from "@clipnotes/shared";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(text), 300);
  }, []);

  const { data, fetchNextPage, hasNextPage, isFetching } =
    useSearch(debouncedQuery);
  const clips = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <View style={s.inputWrapper}>
          <Ionicons
            name="search"
            size={18}
            color="#666"
            style={s.searchIcon}
          />
          <TextInput
            style={s.input}
            placeholder="Search by title, author, or tag..."
            placeholderTextColor="#666"
            value={query}
            onChangeText={handleChange}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <FlatList
        data={clips}
        keyExtractor={(item: Clip) => item.id}
        renderItem={({ item }) => <ClipCard clip={item} />}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={s.empty}>
            {debouncedQuery.length > 0 ? (
              <>
                <Ionicons name="search-outline" size={48} color="#444" />
                <Text style={s.emptyTitle}>No results</Text>
                <Text style={s.emptyText}>
                  No clips matching &quot;{debouncedQuery}&quot;
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={48} color="#444" />
                <Text style={s.emptyTitle}>Search your clips</Text>
                <Text style={s.emptyText}>
                  Find clips by title, author, tags, or notes
                </Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  searchBar: { paddingHorizontal: 16, paddingTop: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 14,
    fontSize: 16,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    color: "#ccc",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyText: { color: "#666", marginTop: 6, textAlign: "center" },
});
