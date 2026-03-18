import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// GET /api/v1/user-tags — get user's personal tag library
export async function GET() {
  try {
    const user = await getOrCreateUser();

    const userTags = await prisma.userTag.findMany({
      where: { userId: user.id },
      include: {
        tag: {
          include: {
            _count: { select: { clips: true } },
          },
        },
      },
      orderBy: { tag: { name: "asc" } },
    });

    // Return flat tag objects with clip counts
    const tags = userTags.map((ut) => ({
      id: ut.tag.id,
      name: ut.tag.name,
      _count: ut.tag._count,
      addedAt: ut.createdAt,
    }));

    return NextResponse.json(tags);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("User tags error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v1/user-tags — add a tag to user's library
export async function POST(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();
    const name = (body.name as string)?.toLowerCase().trim();

    if (!name || name.length > 50) {
      return NextResponse.json(
        { error: "Tag name is required and must be under 50 chars" },
        { status: 400 }
      );
    }

    // Upsert the global tag
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    // Add to user's library (ignore if already there)
    await prisma.userTag.upsert({
      where: { userId_tagId: { userId: user.id, tagId: tag.id } },
      update: {},
      create: { userId: user.id, tagId: tag.id },
    });

    return NextResponse.json({ id: tag.id, name: tag.name }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create user tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/v1/user-tags — remove a tag from user's library
export async function DELETE(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    await prisma.userTag.deleteMany({
      where: { userId: user.id, tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete user tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
