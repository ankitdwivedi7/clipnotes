import { View, Text, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStats } from "@/lib/hooks";
import { Skeleton } from "@/components/Skeleton";

function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: number | string;
}) {
  return (
    <View style={s.statCard}>
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={22}
        color={iconColor}
      />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function BarChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  // Fill last 7 days
  const days: Array<{ label: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const match = data.find((r) => r.date?.toString().startsWith(dateStr));
    days.push({
      label: d.toLocaleDateString("en", { weekday: "short" }),
      count: match?.count ?? 0,
    });
  }

  return (
    <View style={s.chart}>
      <View style={s.bars}>
        {days.map((d, i) => (
          <View key={i} style={s.barCol}>
            <View style={s.barTrack}>
              <View
                style={[
                  s.barFill,
                  {
                    height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0)}%`,
                  },
                ]}
              />
            </View>
            <Text style={s.barLabel}>{d.label}</Text>
            {d.count > 0 && <Text style={s.barCount}>{d.count}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { data: stats, isLoading, isRefetching, refetch } = useStats();

  if (isLoading || !stats) {
    return (
      <View style={s.container}>
        <View style={s.grid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={s.statCard}>
              <Skeleton width={22} height={22} borderRadius={11} />
              <Skeleton width={40} height={28} style={{ marginTop: 8 }} />
              <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#6366f1"
        />
      }
    >
      {/* Overview cards */}
      <View style={s.grid}>
        <StatCard
          icon="videocam"
          iconColor="#6366f1"
          label="Total Clips"
          value={stats.totalClips}
        />
        <StatCard
          icon="checkmark-circle"
          iconColor="#22c55e"
          label="Completed"
          value={stats.completedClips}
        />
        <StatCard
          icon="time"
          iconColor="#f59e0b"
          label="Processing"
          value={stats.processingClips}
        />
        <StatCard
          icon="pricetags"
          iconColor="#8b5cf6"
          label="Tags"
          value={stats.totalTags}
        />
      </View>

      {/* Activity chart */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Last 7 Days</Text>
        <BarChart data={stats.recentActivity} />
      </View>

      {/* Top tags */}
      {stats.topTags.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Top Tags</Text>
          {stats.topTags.map((tag, i) => (
            <View key={tag.name} style={s.tagRow}>
              <Text style={s.tagRank}>#{i + 1}</Text>
              <Text style={s.tagName}>{tag.name}</Text>
              <Text style={s.tagCount}>
                {tag.count} clip{tag.count !== 1 ? "s" : ""}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Platform breakdown */}
      {stats.platforms.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Platforms</Text>
          {stats.platforms.map((p) => {
            const pct =
              stats.totalClips > 0
                ? Math.round((p.count / stats.totalClips) * 100)
                : 0;
            const isYT = p.platform === "YOUTUBE_SHORTS";
            return (
              <View key={p.platform} style={s.platformRow}>
                <Ionicons
                  name={isYT ? "logo-youtube" : "logo-instagram"}
                  size={20}
                  color={isYT ? "#ef4444" : "#e879f9"}
                />
                <Text style={s.platformName}>
                  {isYT ? "YouTube Shorts" : "Instagram Reels"}
                </Text>
                <View style={s.platformBarTrack}>
                  <View
                    style={[
                      s.platformBarFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: isYT ? "#ef4444" : "#e879f9",
                      },
                    ]}
                  />
                </View>
                <Text style={s.platformCount}>{p.count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  content: { padding: 16, paddingBottom: 40 },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: { color: "#888", fontSize: 12, marginTop: 4 },

  // Sections
  section: {
    backgroundColor: "#16213e",
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
  },

  // Chart
  chart: { height: 140 },
  bars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: "center" },
  barTrack: {
    width: "80%",
    height: 90,
    justifyContent: "flex-end",
  },
  barFill: {
    backgroundColor: "#6366f1",
    borderRadius: 4,
    minWidth: 4,
    width: "100%",
  },
  barLabel: { color: "#666", fontSize: 10, marginTop: 4 },
  barCount: { color: "#6366f1", fontSize: 10, fontWeight: "600" },

  // Tags
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
  },
  tagRank: { color: "#555", fontSize: 13, width: 28 },
  tagName: { color: "#fff", fontSize: 15, flex: 1 },
  tagCount: { color: "#888", fontSize: 13 },

  // Platforms
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  platformName: { color: "#ccc", fontSize: 14, width: 120 },
  platformBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 4,
  },
  platformBarFill: { height: "100%", borderRadius: 4 },
  platformCount: { color: "#888", fontSize: 13, width: 30, textAlign: "right" },
});
