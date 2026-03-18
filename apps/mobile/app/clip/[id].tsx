import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useClipPolling,
  useUpdateClip,
  useDeleteClip,
  useUserTags,
} from "@/lib/hooks";
import { EntityChip } from "@/components/EntityChip";
import { ProcessingIndicator } from "@/components/ProcessingIndicator";
import { ClipDetailSkeleton } from "@/components/Skeleton";

/* ───────── Tag Editor ───────── */

function TagEditor({
  clipId,
  clipTags,
}: {
  clipId: string;
  clipTags: Array<{
    tagId: string;
    source: string;
    tag?: { id: string; name: string };
  }>;
}) {
  const { data: userTags } = useUserTags();
  const updateClip = useUpdateClip();
  const clipTagNames = clipTags
    .map((ct) => ct.tag?.name)
    .filter(Boolean) as string[];

  const allTagNames = new Set([
    ...(userTags?.map((t) => t.name) ?? []),
    ...clipTagNames,
  ]);

  const handleToggle = (tagName: string) => {
    if (clipTagNames.includes(tagName)) {
      updateClip.mutate({ id: clipId, data: { removeTags: [tagName] } });
    } else {
      updateClip.mutate({ id: clipId, data: { addTags: [tagName] } });
    }
  };

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Tags</Text>
      <View style={s.chipRow}>
        {Array.from(allTagNames).map((name) => {
          const isActive = clipTagNames.includes(name);
          return (
            <TouchableOpacity
              key={name}
              style={[s.editableTag, isActive && s.editableTagActive]}
              onPress={() => handleToggle(name)}
            >
              <Text
                style={[
                  s.editableTagText,
                  isActive && s.editableTagTextActive,
                ]}
              >
                #{name}
              </Text>
              {isActive && (
                <Ionicons
                  name="close-circle"
                  size={14}
                  color="#6366f1"
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
        {allTagNames.size === 0 && (
          <Text style={{ color: "#666", fontSize: 13 }}>
            Add tags in your library (Collections tab) to tag clips
          </Text>
        )}
      </View>
    </View>
  );
}

/* ───────── Main Screen ───────── */

export default function ClipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: clip, isLoading } = useClipPolling(id);
  const updateClip = useUpdateClip();
  const deleteClip = useDeleteClip();
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  const handleDelete = () => {
    Alert.alert(
      "Delete Clip",
      "Are you sure you want to delete this clip? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteClip.mutateAsync(id);
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading || !clip) {
    return (
      <ScrollView style={s.container}>
        <ClipDetailSkeleton />
      </ScrollView>
    );
  }

  const isProcessing = !["COMPLETED", "FAILED"].includes(clip.status);

  const handleSaveNote = () => {
    updateClip.mutate({ id, data: { userNote: noteText || null } });
    setEditingNote(false);
  };

  const formattedDate = new Date(clip.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
      {/* Hero thumbnail */}
      {clip.thumbnailUrl ? (
        <Image
          source={{ uri: clip.thumbnailUrl }}
          style={s.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[s.thumbnail, s.thumbPlaceholder]}>
          <Ionicons name="videocam-outline" size={48} color="#444" />
        </View>
      )}

      {/* Title & metadata */}
      <Text style={s.title}>{clip.title || "Untitled Clip"}</Text>

      <View style={s.metaRow}>
        {clip.authorName && (
          <View style={s.metaItem}>
            <Ionicons name="person-outline" size={14} color="#888" />
            <Text style={s.metaText}>
              {clip.authorName}
              {clip.authorHandle ? ` (${clip.authorHandle})` : ""}
            </Text>
          </View>
        )}
        <View style={s.metaItem}>
          <Ionicons
            name={
              clip.platform === "YOUTUBE_SHORTS"
                ? "logo-youtube"
                : "logo-instagram"
            }
            size={14}
            color="#888"
          />
          <Text style={s.metaText}>
            {clip.platform === "YOUTUBE_SHORTS"
              ? "YouTube Shorts"
              : "Instagram Reels"}
          </Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={14} color="#888" />
          <Text style={s.metaText}>{formattedDate}</Text>
        </View>
      </View>

      {/* Processing state */}
      {isProcessing && (
        <View style={s.processingBox}>
          <ProcessingIndicator status={clip.status} expanded />
        </View>
      )}

      {clip.status === "FAILED" && (
        <View style={s.failedBox}>
          <Ionicons name="alert-circle" size={20} color="#e94560" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={s.failedTitle}>Processing Failed</Text>
            <Text style={s.failedReason}>
              {clip.failureReason || "Unknown error"}
            </Text>
          </View>
        </View>
      )}

      {/* Summary */}
      {clip.summary && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="document-text-outline" size={16} color="#6366f1" />
            <Text style={s.cardTitle}>Summary</Text>
          </View>
          <Text style={s.bodyText}>{clip.summary}</Text>
        </View>
      )}

      {/* Key Takeaways */}
      {clip.keyTakeaways && clip.keyTakeaways.length > 0 && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
            <Text style={s.cardTitle}>Key Takeaways</Text>
          </View>
          {clip.keyTakeaways.map((t: string, i: number) => (
            <View key={i} style={s.takeawayRow}>
              <View style={s.takeawayBullet}>
                <Text style={s.takeawayNumber}>{i + 1}</Text>
              </View>
              <Text style={s.takeawayText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Entities */}
      {clip.entities && clip.entities.length > 0 && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="pricetags-outline" size={16} color="#10b981" />
            <Text style={s.cardTitle}>Mentioned</Text>
          </View>
          <View style={s.chipRow}>
            {clip.entities.map((e: { id: string; name: string; type: string }) => (
              <EntityChip key={e.id} entity={e} />
            ))}
          </View>
        </View>
      )}

      {/* Tags */}
      <TagEditor clipId={id} clipTags={clip.tags ?? []} />

      {/* Note */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="create-outline" size={16} color="#8b5cf6" />
          <Text style={s.cardTitle}>Your Note</Text>
        </View>
        {editingNote ? (
          <View>
            <TextInput
              style={s.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={3}
              placeholder="Write a note..."
              placeholderTextColor="#666"
              autoFocus
            />
            <View style={s.noteActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setEditingNote(false)}
              >
                <Text style={s.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSaveNote}>
                <Text style={s.btnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={s.noteBox}
            onPress={() => {
              setNoteText(clip.userNote || "");
              setEditingNote(true);
            }}
          >
            <Text
              style={[s.noteText, !clip.userNote && { fontStyle: "italic" }]}
            >
              {clip.userNote || "Tap to add a note..."}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action buttons */}
      <View style={s.actionRow}>
        <TouchableOpacity
          style={[s.actionBtn, s.openBtn]}
          onPress={() => Linking.openURL(clip.originalUrl)}
        >
          <Ionicons name="open-outline" size={18} color="#6366f1" />
          <Text style={s.openBtnText}>Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, s.shareBtn]}
          onPress={() => {
            const parts = [`📎 ${clip.title || "Clip"}`];
            if (clip.summary) parts.push(`\n${clip.summary}`);
            if (clip.keyTakeaways?.length) {
              parts.push(
                "\n🔑 Key Takeaways:\n" +
                  clip.keyTakeaways
                    .map((t: string, i: number) => `${i + 1}. ${t}`)
                    .join("\n")
              );
            }
            parts.push(`\n🔗 ${clip.originalUrl}`);
            Share.share({ message: parts.join("\n") });
          }}
        >
          <Ionicons name="share-outline" size={18} color="#10b981" />
          <Text style={s.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color="#e94560" />
        <Text style={s.deleteBtnText}>Delete Clip</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ───────── Styles ───────── */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Hero
  thumbnail: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
  },
  thumbPlaceholder: {
    backgroundColor: "#16213e",
    alignItems: "center",
    justifyContent: "center",
  },

  // Title & meta
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", lineHeight: 28 },
  metaRow: { marginTop: 10, gap: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: "#888", fontSize: 13 },

  // Processing
  processingBox: {
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },

  // Failed
  failedBox: {
    backgroundColor: "rgba(233,69,96,0.1)",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  failedTitle: { color: "#e94560", fontWeight: "600", fontSize: 14 },
  failedReason: { color: "#999", fontSize: 13, marginTop: 2 },

  // Cards (sections)
  card: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  bodyText: { color: "#ccc", fontSize: 15, lineHeight: 24 },

  // Takeaways
  takeawayRow: { flexDirection: "row", marginBottom: 10, alignItems: "flex-start" },
  takeawayBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  takeawayNumber: { color: "#f59e0b", fontSize: 12, fontWeight: "700" },
  takeawayText: { color: "#ccc", flex: 1, fontSize: 14, lineHeight: 22 },

  // Entities & tags
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { marginTop: 16 },
  sectionTitle: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  editableTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#333",
  },
  editableTagActive: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderColor: "#6366f1",
  },
  editableTagText: { color: "#888", fontSize: 13 },
  editableTagTextActive: { color: "#6366f1", fontWeight: "600" },

  // Note
  noteInput: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
  },
  noteActions: { flexDirection: "row", gap: 8, marginTop: 10, justifyContent: "flex-end" },
  cancelBtn: {
    backgroundColor: "#333",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  noteBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: 14,
  },
  noteText: { color: "#ccc", fontSize: 14, lineHeight: 20 },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  openBtn: {
    backgroundColor: "rgba(99,102,241,0.15)",
  },
  openBtnText: { color: "#6366f1", fontWeight: "600", fontSize: 15 },
  shareBtn: {
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  shareBtnText: { color: "#10b981", fontWeight: "600", fontSize: 15 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "rgba(233,69,96,0.08)",
  },
  deleteBtnText: { color: "#e94560", fontWeight: "600", fontSize: 15 },
});
