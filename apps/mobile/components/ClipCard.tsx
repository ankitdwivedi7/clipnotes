import { useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { Clip } from "@clipnotes/shared";
import { TagPill } from "./TagPill";
import { ProcessingIndicator } from "./ProcessingIndicator";
import { useDeleteClip, useRetryClip } from "@/lib/hooks";

interface Props {
  clip: Clip;
}

export function ClipCard({ clip }: Props) {
  const router = useRouter();
  const deleteClip = useDeleteClip();
  const retryClip = useRetryClip();
  const swipeRef = useRef<Swipeable>(null);
  const isProcessing = !["COMPLETED", "FAILED"].includes(clip.status);

  const handleDelete = () => {
    Alert.alert(
      "Delete Clip",
      `Delete "${clip.title || "this clip"}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => swipeRef.current?.close(),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteClip.mutate(clip.id),
        },
      ]
    );
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });
    return (
      <TouchableOpacity style={s.deleteAction} onPress={handleDelete}>
        <Animated.View
          style={{ transform: [{ scale }], alignItems: "center" }}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={s.deleteActionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/clip/${clip.id}`)}
        activeOpacity={0.7}
      >
        {clip.thumbnailUrl ? (
          <Image
            source={{ uri: clip.thumbnailUrl }}
            style={s.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.thumb, s.placeholder]}>
            <Ionicons
              name={
                clip.platform === "YOUTUBE_SHORTS"
                  ? "logo-youtube"
                  : "logo-instagram"
              }
              size={24}
              color="#555"
            />
          </View>
        )}
        <View style={s.content}>
          <Text style={s.title} numberOfLines={2}>
            {clip.title || clip.originalUrl}
          </Text>
          {clip.authorName && (
            <Text style={s.author} numberOfLines={1}>
              {clip.authorName}
            </Text>
          )}
          {isProcessing ? (
            <ProcessingIndicator status={clip.status} />
          ) : clip.status === "FAILED" ? (
            <View style={s.failedRow}>
              <Ionicons name="alert-circle" size={14} color="#e94560" />
              <Text style={s.failed}>Processing failed</Text>
              <TouchableOpacity
                style={s.retryBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  retryClip.mutate(clip.id);
                }}
                disabled={retryClip.isPending}
              >
                <Ionicons name="refresh" size={13} color="#6366f1" />
                <Text style={s.retryText}>
                  {retryClip.isPending ? "Retrying..." : "Retry"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.tags}>
              {clip.tags?.slice(0, 3).map((ct) => (
                <TagPill key={ct.tagId} name={ct.tag?.name || ""} small />
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
  },
  thumb: { width: 80, height: 80, borderRadius: 10, marginRight: 12 },
  placeholder: {
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, justifyContent: "center" },
  title: { color: "#fff", fontWeight: "600", fontSize: 15, lineHeight: 20 },
  author: { color: "#888", fontSize: 13, marginTop: 3 },
  failed: { color: "#e94560", fontSize: 12, marginLeft: 4 },
  failedRow: { flexDirection: "row", alignItems: "center", marginTop: 8, flexWrap: "wrap" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  retryText: { color: "#6366f1", fontSize: 11, fontWeight: "600", marginLeft: 3 },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 4 },
  deleteAction: {
    backgroundColor: "#e94560",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 14,
    marginBottom: 10,
    marginLeft: 8,
  },
  deleteActionText: { color: "#fff", fontSize: 12, marginTop: 4 },
});
