import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIngestClip, useUserTags, useCreateUserTag } from "@/lib/hooks";

interface Props {
  visible: boolean;
  onClose: () => void;
  initialUrl?: string | null;
}

export function AddUrlModal({ visible, onClose, initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Sync URL when modal opens via deep link
  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
  }, [initialUrl]);
  const [newTagText, setNewTagText] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const ingest = useIngestClip();
  const { data: userTags } = useUserTags();
  const createTag = useCreateUserTag();

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const handleAddNewTag = async () => {
    const name = newTagText.trim().toLowerCase();
    if (!name) return;
    try {
      await createTag.mutateAsync(name);
      setSelectedTags((prev) => [...prev, name]);
      setNewTagText("");
    } catch {
      // tag may already exist, just select it
      if (!selectedTags.includes(name)) {
        setSelectedTags((prev) => [...prev, name]);
      }
      setNewTagText("");
    }
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please paste a URL");
      return;
    }

    const isYT =
      trimmed.includes("youtube.com/shorts") ||
      trimmed.includes("youtu.be");
    const isIG =
      trimmed.includes("instagram.com/reel") ||
      trimmed.includes("instagram.com/p/");

    if (!isYT && !isIG) {
      setError("Only YouTube Shorts and Instagram Reels are supported");
      return;
    }

    setError("");
    try {
      await ingest.mutateAsync({
        url: trimmed,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        note: note.trim() || undefined,
      });
      setUrl("");
      setSelectedTags([]);
      setNote("");
      setNewTagText("");
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save clip";
      setError(msg);
    }
  };

  const handleClose = () => {
    setUrl("");
    setSelectedTags([]);
    setNote("");
    setNewTagText("");
    setError("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Add Clip</Text>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Text style={s.label}>URL</Text>
          <TextInput
            style={s.input}
            placeholder="Paste YouTube Short or Instagram Reel URL"
            placeholderTextColor="#666"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
          />

          <Text style={s.label}>Tags</Text>
          {userTags && userTags.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.tagScroll}
            >
              {userTags.map((t) => {
                const selected = selectedTags.includes(t.name);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.tagChip, selected && s.tagChipSelected]}
                    onPress={() => toggleTag(t.name)}
                  >
                    <Text
                      style={[s.tagChipText, selected && s.tagChipTextSelected]}
                    >
                      #{t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={s.hint}>
              No tags in your library yet. Add one below or go to Collections.
            </Text>
          )}

          {/* Inline new tag creation */}
          <View style={s.newTagRow}>
            <TextInput
              style={s.newTagInput}
              placeholder="+ New tag"
              placeholderTextColor="#666"
              value={newTagText}
              onChangeText={setNewTagText}
              autoCapitalize="none"
              onSubmitEditing={handleAddNewTag}
              returnKeyType="done"
            />
            {newTagText.trim() ? (
              <TouchableOpacity style={s.newTagBtn} onPress={handleAddNewTag}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={s.label}>Note (optional)</Text>
          <TextInput
            style={[s.input, { height: 60 }]}
            placeholder="Add a personal note..."
            placeholderTextColor="#666"
            value={note}
            onChangeText={setNote}
            multiline
          />

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, ingest.isPending && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={ingest.isPending}
            >
              {ingest.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.saveText}>Save Clip</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  hint: {
    color: "#666",
    fontSize: 13,
    fontStyle: "italic",
  },
  error: {
    color: "#e94560",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#16213e",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
  },
  tagScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  tagChip: {
    backgroundColor: "#16213e",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  tagChipSelected: {
    backgroundColor: "rgba(99,102,241,0.25)",
    borderColor: "#6366f1",
  },
  tagChipText: {
    color: "#999",
    fontSize: 14,
  },
  tagChipTextSelected: {
    color: "#6366f1",
    fontWeight: "600",
  },
  newTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  newTagInput: {
    flex: 1,
    backgroundColor: "#16213e",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  newTagBtn: {
    backgroundColor: "#6366f1",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#333",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#ccc",
    fontWeight: "600",
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
