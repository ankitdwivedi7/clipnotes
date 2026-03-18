import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from "react-native";
import {
  useUserTags,
  useCreateUserTag,
  useDeleteUserTag,
  useClips,
} from "@/lib/hooks";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ClipCardSkeleton } from "@/components/Skeleton";
import type { Clip } from "@clipnotes/shared";
import type { UserTagItem } from "@/lib/api";

function TagGroup({ tag }: { tag: UserTagItem }) {
  const router = useRouter();
  const deleteTag = useDeleteUserTag();
  const { data } = useClips({ tag: tag.name });
  const clips = data?.pages.flatMap((p) => p.data) ?? [];
  const previewClips = clips.slice(0, 4);
  const clipCount = tag._count?.clips ?? 0;

  const handleLongPress = () => {
    Alert.alert(
      `Remove #${tag.name}?`,
      "This removes it from your tag library. Clips won't lose this tag.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteTag.mutate(tag.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/tag/${tag.name}`)}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail grid */}
      <View style={s.thumbGrid}>
        {previewClips.length > 0 ? (
          previewClips.map((clip: Clip) => (
            <View key={clip.id} style={s.thumbSlot}>
              {clip.thumbnailUrl ? (
                <Image
                  source={{ uri: clip.thumbnailUrl }}
                  style={s.thumbImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[s.thumbImage, s.thumbPlaceholder]}>
                  <Ionicons
                    name={
                      clip.platform === "YOUTUBE_SHORTS"
                        ? "logo-youtube"
                        : "logo-instagram"
                    }
                    size={16}
                    color="#555"
                  />
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={[s.thumbGrid, s.emptyGrid]}>
            <Ionicons name="images-outline" size={28} color="#333" />
          </View>
        )}
        {previewClips.length > 0 &&
          previewClips.length < 4 &&
          Array.from({ length: 4 - previewClips.length }).map((_, i) => (
            <View key={`empty-${i}`} style={s.thumbSlot}>
              <View style={[s.thumbImage, s.thumbEmpty]} />
            </View>
          ))}
      </View>

      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.tagName}>#{tag.name}</Text>
          <Ionicons name="chevron-forward" size={16} color="#555" />
        </View>
        <Text style={s.count}>
          {clipCount} clip{clipCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CollectionsScreen() {
  const { data: userTags, isLoading, isRefetching, refetch } = useUserTags();
  const createTag = useCreateUserTag();
  const [newTag, setNewTag] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = async () => {
    const name = newTag.trim().toLowerCase();
    if (!name) return;
    try {
      await createTag.mutateAsync(name);
      setNewTag("");
      setShowAdd(false);
    } catch {
      Alert.alert("Error", "Failed to create tag");
    }
  };

  return (
    <View style={s.container}>
      {/* Add tag bar */}
      <View style={s.addBar}>
        {showAdd ? (
          <View style={s.addRow}>
            <TextInput
              style={s.addInput}
              placeholder="e.g. cooking, fitness, tech"
              placeholderTextColor="#666"
              value={newTag}
              onChangeText={setNewTag}
              autoCapitalize="none"
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.cancelIconBtn}
              onPress={() => {
                setShowAdd(false);
                setNewTag("");
              }}
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={s.addTagButton}
            onPress={() => setShowAdd(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
            <Text style={s.addTagText}>Add Tag to Library</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={userTags ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={{ padding: 12, paddingTop: 4, flexGrow: 1 }}
        renderItem={({ item }) => <TagGroup tag={item} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="pricetags-outline" size={36} color="#6366f1" />
              </View>
              <Text style={s.emptyTitle}>No tags yet</Text>
              <Text style={s.emptySubtitle}>
                Create tags like &quot;cooking&quot; or &quot;tech&quot; to organize your clips
                into collections
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => setShowAdd(true)}
              >
                <Text style={s.emptyBtnText}>Create Your First Tag</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Hint at bottom */}
      {(userTags?.length ?? 0) > 0 && (
        <View style={s.hint}>
          <Ionicons name="information-circle-outline" size={14} color="#555" />
          <Text style={s.hintText}>Long-press a tag to remove it</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  addBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#16213e",
  },
  addTagButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  addTagText: { color: "#6366f1", fontWeight: "600", fontSize: 15 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addInput: {
    flex: 1,
    backgroundColor: "#16213e",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: "#6366f1",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { gap: 12, paddingHorizontal: 4 },
  card: {
    flex: 1,
    backgroundColor: "#16213e",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  thumbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    height: 120,
  },
  emptyGrid: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  thumbSlot: {
    width: "50%",
    height: 60,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbEmpty: {
    backgroundColor: "#111827",
  },
  info: {
    padding: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagName: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  count: {
    color: "#888",
    fontSize: 12,
    marginTop: 3,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(99,102,241,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { color: "#ccc", fontSize: 20, fontWeight: "700" },
  emptySubtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#16213e",
  },
  hintText: { color: "#555", fontSize: 12 },
});
