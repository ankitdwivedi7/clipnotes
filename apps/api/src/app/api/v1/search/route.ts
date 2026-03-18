import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { searchQuerySchema } from "@clipnotes/shared";

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = searchQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, tag, cursor, limit } = parsed.data;

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    // Use Prisma for reliable search with tags included
    const clips = await prisma.clip.findMany({
      where: {
        userId: user.id,
        ...(tag
          ? { tags: { some: { tag: { name: tag.toLowerCase() } } } }
          : {}),
        ...(cursor
          ? {
              createdAt: {
                lt: (await prisma.clip.findUnique({ where: { id: cursor }, select: { createdAt: true } }))?.createdAt ?? new Date(),
              },
            }
          : {}),
        OR: [
          { title: { contains: q.trim(), mode: "insensitive" } },
          { summary: { contains: q.trim(), mode: "insensitive" } },
          { authorName: { contains: q.trim(), mode: "insensitive" } },
          { userNote: { contains: q.trim(), mode: "insensitive" } },
          { tags: { some: { tag: { name: { contains: q.trim(), mode: "insensitive" } } } } },
        ],
      },
      include: {
        tags: { include: { tag: true } },
        entities: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = clips.length > limit;
    const data = hasMore ? clips.slice(0, limit) : clips;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ data, nextCursor, hasMore });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
