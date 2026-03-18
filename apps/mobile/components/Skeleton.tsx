import { useEffect, useRef } from "react";
import { Animated, StyleSheet, type ViewStyle } from "react-native";

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: "#2a2a4a",
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ClipCardSkeleton() {
  return (
    <Animated.View style={sk.card}>
      <Skeleton width={80} height={80} borderRadius={8} />
      <Animated.View style={sk.content}>
        <Skeleton width="90%" height={16} />
        <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
        <Animated.View style={sk.tags}>
          <Skeleton width={60} height={20} borderRadius={10} />
          <Skeleton width={50} height={20} borderRadius={10} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

export function ClipDetailSkeleton() {
  return (
    <Animated.View style={sk.detail}>
      <Skeleton width="100%" height={210} borderRadius={12} />
      <Skeleton width="80%" height={22} style={{ marginTop: 16 }} />
      <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width={120} height={24} borderRadius={12} style={{ marginTop: 12 }} />

      <Skeleton width="30%" height={12} style={{ marginTop: 32 }} />
      <Skeleton width="100%" height={14} style={{ marginTop: 10 }} />
      <Skeleton width="95%" height={14} style={{ marginTop: 6 }} />
      <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />

      <Skeleton width="30%" height={12} style={{ marginTop: 28 }} />
      <Skeleton width="85%" height={14} style={{ marginTop: 10 }} />
      <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />

      <Skeleton width="30%" height={12} style={{ marginTop: 28 }} />
      <Animated.View style={sk.tags}>
        <Skeleton width={80} height={28} borderRadius={14} />
        <Skeleton width={70} height={28} borderRadius={14} />
        <Skeleton width={60} height={28} borderRadius={14} />
      </Animated.View>
    </Animated.View>
  );
}

const sk = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
  },
  content: { flex: 1, marginLeft: 12 },
  tags: { flexDirection: "row", gap: 8, marginTop: 12 },
  detail: { padding: 16 },
});
