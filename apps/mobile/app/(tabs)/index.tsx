import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useClips, useBatchDeleteClips, useBatchTagClips, useUserTags } from "@/lib/hooks";
import { ClipCard } from "@/components/ClipCard";
import { ClipCardSkeleton } from "@/components/Skeleton";
import { AddUrlModal } from "@/components/AddUrlModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { consumePendingIngestUrl } from "@/lib/deep-link-store";
import type { Clip } from "@clipnotes/shared";

function LoadingList() {
  return (
    <View style={{ padding: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <ClipCardSkeleton key={i} />
      ))}
    </View>
  );
}

export default function InboxScreen() {
  const [showAdd, setShowAdd] = useState(false);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const batchDelete = useBatchDeleteClips();
  const batchTag = useBatchTagClips();
  const { data: userTags } = useUserTags();

  useEffect(() => {
    AsyncStorage.getItem("onboarding_complete").then((val) => {
      if (!val) setShowOnboarding(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      const url = consumePendingIngestUrl();
      if (url) {
        setDeepLinkUrl(url);
        setShowAdd(true);
      }
    }, [])
  );

  const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage } =
    useClips();

  const clips = data?.pages.flatMap((p) => p.data) ?? [];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const handleBatchDelete = () => {
    Alert.alert(
      "Delete clips",
      `Delete ${selected.size} selected clip${selected.size !== 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await batchDelete.mutateAsync([...selected]);
            exitSelectMode();
          },
        },
      ]
    );
  };

  const handleBatchTag = () => {
    const tagNames = userTags?.map((t) => t.name) ?? [];
    if (tagNames.length === 0) {
      Alert.alert("No tags", "Create tags in the Collections tab first");
      return;
    }
    Alert.alert(
      "Tag clips",
      `Choose a tag for ${selected.size} clip${selected.size !== 1 ? "s" : ""}`,
      [
        ...tagNames.slice(0, 4).map((name) => ({
          text: `#${name}`,
          onPress: async () => {
            await batchTag.mutateAsync({ ids: [...selected], tagNames: [name] });
            exitSelectMode();
          },
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Select mode header */}
      {selectMode && (
        <View style={styles.selectBar}>
          <TouchableOpacity onPress={exitSelectMode}>
            <Text style={styles.selectCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectCount}>{selected.size} selected</Text>
          <View style={styles.selectActions}>
            <TouchableOpacity
              onPress={handleBatchTag}
              disabled={selected.size === 0}
              style={[styles.selectAction, selected.size === 0 && { opacity: 0.4 }]}
            >
              <Ionicons name="pricetag" size={20} color="#6366f1" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleBatchDelete}
              disabled={selected.size === 0}
              style={[styles.selectAction, selected.size === 0 && { opacity: 0.4 }]}
            >
              <Ionicons name="trash" size={20} color="#e94560" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <LoadingList />
      ) : (
        <FlatList
          data={clips}
          keyExtractor={(item: Clip) => item.id}
          renderItem={({ item }) =>
            selectMode ? (
              <TouchableOpacity
                style={[
                  styles.selectCard,
                  selected.has(item.id) && styles.selectCardActive,
                ]}
                onPress={() => toggleSelect(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.checkbox}>
                  {selected.has(item.id) && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <ClipCard clip={item} />
                </View>
              </TouchableOpacity>
            ) : (
              <ClipCard clip={item} />
            )
          }
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
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
            <View style={styles.empty}>
              <Ionicons name="videocam-outline" size={48} color="#444" />
              <Text style={styles.emptyTitle}>No clips yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to add a YouTube Short or Instagram Reel
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom buttons — show select toggle when not in select mode */}
      {!selectMode && clips.length > 0 && (
        <TouchableOpacity
          style={styles.selectToggle}
          onPress={() => setSelectMode(true)}
        >
          <Ionicons name="checkbox-outline" size={20} color="#888" />
        </TouchableOpacity>
      )}

      {/* FAB */}
      {!selectMode && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <AddUrlModal
        visible={showAdd}
        initialUrl={deepLinkUrl}
        onClose={() => {
          setShowAdd(false);
          setDeepLinkUrl(null);
        }}
      />

      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: { color: "#ccc", fontSize: 18, fontWeight: "600", marginTop: 12 },
  emptySubtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  selectToggle: {
    position: "absolute",
    left: 20,
    bottom: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#16213e",
    alignItems: "center",
    justifyContent: "center",
  },
  // Select mode
  selectBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#16213e",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
  },
  selectCancel: { color: "#6366f1", fontSize: 15, fontWeight: "600" },
  selectCount: { color: "#ccc", fontSize: 15, flex: 1, textAlign: "center" },
  selectActions: { flexDirection: "row", gap: 16 },
  selectAction: { padding: 4 },
  selectCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: -10, // offset ClipCard's own marginBottom
  },
  selectCardActive: { opacity: 1 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "transparent",
  },
});
