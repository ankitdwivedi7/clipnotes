import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useIngestClip } from "@/lib/hooks";
import { isSupportedUrl } from "@clipnotes/shared";

interface Props {
  url: string;
  onDismiss: () => void;
}

export function ShareReceiver({ url, onDismiss }: Props) {
  const ingest = useIngestClip();
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");

  const isSupported = isSupportedUrl(url);

  const handleSave = async () => {
    if (!isSupported) return;
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      await ingest.mutateAsync({
        url,
        tags: tagList.length > 0 ? tagList : undefined,
        note: note.trim() || undefined,
      });
      Alert.alert("Saved!", "Your clip is being processed.", [
        { text: "OK", onPress: onDismiss },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save");
    }
  };

  return (
    <View style={s.overlay}>
      <View style={s.sheet}>
        <Text style={s.title}>Save Clip</Text>
        <View style={s.urlBox}>
          <Text style={s.urlText} numberOfLines={2}>{url}</Text>
          {!isSupported && <Text style={s.unsupported}>Only YouTube Shorts and Instagram Reels are supported</Text>}
        </View>
        <TextInput style={s.input} placeholder="Tags (comma separated)" placeholderTextColor="#666" value={tags} onChangeText={setTags} />
        <TextInput style={s.input} placeholder="Add a note..." placeholderTextColor="#666" value={note} onChangeText={setNote} multiline />
        <View style={s.buttons}>
          <TouchableOpacity style={s.cancelBtn} onPress={onDismiss}>
            <Text style={s.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.saveBtn, (!isSupported || ingest.isPending) && s.disabled]} onPress={handleSave} disabled={!isSupported || ingest.isPending}>
            {ingest.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#1a1a2e", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#16213e", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  urlBox: { backgroundColor: "#333", borderRadius: 8, padding: 12, marginBottom: 16 },
  urlText: { color: "#ccc", fontSize: 14 },
  unsupported: { color: "#e94560", fontSize: 12, marginTop: 4 },
  input: { backgroundColor: "#333", color: "#fff", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, marginBottom: 12, fontSize: 16 },
  buttons: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: "#555", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  saveBtn: { flex: 1, backgroundColor: "#6366f1", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  disabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
