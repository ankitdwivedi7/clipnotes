import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const STEPS = [
  { key: "QUEUED", label: "Queued" },
  { key: "FETCHING_METADATA", label: "Fetching info" },
  { key: "EXTRACTING_TRANSCRIPT", label: "Getting transcript" },
  { key: "SUMMARIZING", label: "AI analyzing" },
];

interface Props {
  status: string;
  expanded?: boolean;
}

export function ProcessingIndicator({ status, expanded }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const label = STEPS[currentIdx]?.label || "Processing";

  if (!expanded) {
    return (
      <View style={s.row}>
        <ActivityIndicator size="small" color="#6366f1" />
        <Text style={s.text}>{label}...</Text>
      </View>
    );
  }

  return (
    <View style={s.expanded}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <View key={step.key} style={s.stepRow}>
            {done ? (
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
            ) : active ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Ionicons name="ellipse-outline" size={18} color="#444" />
            )}
            <Text
              style={[
                s.stepLabel,
                done && s.stepDone,
                active && s.stepActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  text: { color: "#6366f1", fontSize: 12, marginLeft: 8 },
  expanded: { gap: 10 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepLabel: { color: "#555", fontSize: 14 },
  stepDone: { color: "#22c55e" },
  stepActive: { color: "#6366f1", fontWeight: "600" },
});
