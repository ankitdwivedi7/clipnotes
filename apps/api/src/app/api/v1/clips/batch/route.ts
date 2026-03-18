import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// Batch delete clips
export async function DELETE(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();
    const ids = body.ids as string[];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }

    if (ids.length > 50) {
      return NextResponse.json({ error: "Max 50 clips at once" }, { status: 400 });
    }

    const result = await prisma.clip.deleteMany({
      where: { id: { in: ids }, userId: user.id },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Batch delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Batch add tags to clips
export async function PATCH(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();
    const ids = body.ids as string[];
    const addTags = body.addTags as string[];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array required" }, { status: 400 });
    }

    if (!Array.isArray(addTags) || addTags.length === 0) {
      return NextResponse.json({ error: "addTags array required" }, { status: 400 });
    }

    // Verify ownership
    const clips = await prisma.clip.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    });

    const validIds = clips.map((c) => c.id);

    // Upsert tags
    const tags = await Promise.all(
      addTags.map((name) =>
        prisma.tag.upsert({
          where: { name: name.toLowerCase() },
          update: {},
          create: { name: name.toLowerCase() },
        })
      )
    );

    // Create clip-tag relations
    let created = 0;
    for (const clipId of validIds) {
      for (const tag of tags) {
        try {
          await prisma.clipTag.create({
            data: { clipId, tagId: tag.id, source: "USER" },
          });
          created++;
        } catch {
          // Already exists — skip
        }
      }
    }

    return NextResponse.json({ updated: validIds.length, tagsAdded: created });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Batch tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
