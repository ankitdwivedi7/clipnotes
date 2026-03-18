import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Entity } from "@clipnotes/shared";

const TYPE_CONFIG: Record<string, { color: string; icon: string }> = {
  PERSON: { color: "#3b82f6", icon: "person" },
  PRODUCT: { color: "#22c55e", icon: "cube" },
  BRAND: { color: "#a855f7", icon: "briefcase" },
  PLACE: { color: "#f97316", icon: "location" },
  CONCEPT: { color: "#14b8a6", icon: "bulb" },
};

interface Props {
  entity: Entity;
}

export function EntityChip({ entity }: Props) {
  const config = TYPE_CONFIG[entity.type] || { color: "#666", icon: "ellipse" };

  return (
    <View style={[s.chip, { backgroundColor: `${config.color}18` }]}>
      <Ionicons
        name={config.icon as keyof typeof Ionicons.glyphMap}
        size={12}
        color={config.color}
      />
      <Text style={[s.name, { color: config.color }]}>{entity.name}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: { fontSize: 13, fontWeight: "500" },
});
