import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateUser();

    const [
      totalClips,
      completedClips,
      failedClips,
      totalTags,
      topTags,
      recentActivity,
      platformCounts,
    ] = await Promise.all([
      // Total clips
      prisma.clip.count({ where: { userId: user.id } }),

      // Completed clips
      prisma.clip.count({ where: { userId: user.id, status: "COMPLETED" } }),

      // Failed clips
      prisma.clip.count({ where: { userId: user.id, status: "FAILED" } }),

      // Total tags in library
      prisma.userTag.count({ where: { userId: user.id } }),

      // Top 5 tags by clip count
      prisma.tag.findMany({
        where: { clips: { some: { clip: { userId: user.id } } } },
        select: {
          name: true,
          _count: { select: { clips: true } },
        },
        orderBy: { clips: { _count: "desc" } },
        take: 5,
      }),

      // Clips per day for last 7 days
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "Clip"
        WHERE "userId" = ${user.id}
          AND "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      `,

      // Platform breakdown
      prisma.clip.groupBy({
        by: ["platform"],
        where: { userId: user.id },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      totalClips,
      completedClips,
      failedClips,
      processingClips: totalClips - completedClips - failedClips,
      totalTags,
      topTags: topTags.map((t) => ({
        name: t.name,
        count: t._count.clips,
      })),
      recentActivity: recentActivity.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      platforms: platformCounts.map((p) => ({
        platform: p.platform,
        count: p._count,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
