import { Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  name: string;
  small?: boolean;
  active?: boolean;
  onPress?: () => void;
}

export function TagPill({ name, small, active, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[s.pill, active && s.active, small && s.small]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[s.text, active && s.activeText, small && s.smallText]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: {
    backgroundColor: "rgba(99,102,241,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  active: { backgroundColor: "#6366f1" },
  small: { paddingHorizontal: 10, paddingVertical: 3 },
  text: { color: "#818cf8", fontSize: 13, fontWeight: "500" },
  activeText: { color: "#fff" },
  smallText: { fontSize: 12 },
});
