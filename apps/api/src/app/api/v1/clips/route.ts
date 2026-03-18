import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { clipsQuerySchema } from "@clipnotes/shared";

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = clipsQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, tag, platform, cursor, limit } = parsed.data;

    const where: Record<string, unknown> = { userId: user.id };
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (tag) {
      where.tags = { some: { tag: { name: tag.toLowerCase() } } };
    }

    const clips = await prisma.clip.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "desc" },
      include: {
        tags: { include: { tag: true } },
        entities: true,
      },
    });

    const hasMore = clips.length > limit;
    const data = hasMore ? clips.slice(0, limit) : clips;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, nextCursor, hasMore });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clips list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
