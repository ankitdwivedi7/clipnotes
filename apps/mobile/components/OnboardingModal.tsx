import { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const PAGES = [
  {
    icon: "videocam" as const,
    iconColor: "#6366f1",
    title: "Welcome to ClipNotes",
    body: "Save YouTube Shorts and Instagram Reels, and get AI-powered summaries, key takeaways, and more.",
  },
  {
    icon: "add-circle" as const,
    iconColor: "#22c55e",
    title: "Add Clips",
    body: "Tap the + button on the Inbox tab to paste a URL. Or share directly from YouTube/Instagram using the iOS Shortcut.",
  },
  {
    icon: "cut" as const,
    iconColor: "#f59e0b",
    title: "iOS Shortcut Setup",
    body: '1. Open the Shortcuts app\n2. Create "Save to ClipNotes"\n3. Add action: Open URLs\n4. Set URL to: clipnotes://ingest?url=\n   + Shortcut Input\n5. Enable "Show in Share Sheet"\n\nNow share from any app!',
  },
  {
    icon: "pricetags" as const,
    iconColor: "#8b5cf6",
    title: "Organize with Tags",
    body: "Create your own tags in the Collections tab. Tag clips to group them. Swipe left on a clip to delete it.",
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function OnboardingModal({ visible, onClose }: Props) {
  const [page, setPage] = useState(0);
  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  const handleDone = async () => {
    await AsyncStorage.setItem("onboarding_complete", "1");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.iconCircle}>
            <Ionicons
              name={current.icon}
              size={36}
              color={current.iconColor}
            />
          </View>

          <Text style={s.title}>{current.title}</Text>

          <ScrollView style={s.bodyScroll} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={s.body}>{current.body}</Text>
          </ScrollView>

          {/* Dots */}
          <View style={s.dots}>
            {PAGES.map((_, i) => (
              <View
                key={i}
                style={[s.dot, i === page && s.dotActive]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={s.buttons}>
            {page > 0 ? (
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => setPage(page - 1)}
              >
                <Text style={s.backBtnText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.backBtn} onPress={handleDone}>
                <Text style={s.backBtnText}>Skip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={s.nextBtn}
              onPress={isLast ? handleDone : () => setPage(page + 1)}
            >
              <Text style={s.nextBtnText}>
                {isLast ? "Get Started" : "Next"}
              </Text>
              {!isLast && (
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: "#1e2746",
    borderRadius: 24,
    padding: 28,
    width: width - 48,
    maxHeight: "80%",
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(99,102,241,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  bodyScroll: {
    maxHeight: 200,
    width: "100%",
  },
  body: {
    color: "#aaa",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  dotActive: {
    backgroundColor: "#6366f1",
    width: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  backBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#16213e",
  },
  backBtnText: { color: "#888", fontWeight: "600", fontSize: 15 },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#6366f1",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  nextBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
