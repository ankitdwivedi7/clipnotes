import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { clipUpdateSchema } from "@clipnotes/shared";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    const clip = await prisma.clip.findFirst({
      where: { id, userId: user.id },
      include: {
        tags: { include: { tag: true } },
        entities: true,
      },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    return NextResponse.json(clip);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clip detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = clipUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.clip.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const { userNote, addTags, removeTags } = parsed.data;

    // Update note if provided
    if (userNote !== undefined) {
      await prisma.clip.update({
        where: { id },
        data: { userNote },
      });
    }

    // Add tags
    if (addTags && addTags.length > 0) {
      for (const tagName of addTags) {
        const normalized = tagName.toLowerCase().trim();
        const tag = await prisma.tag.upsert({
          where: { name: normalized },
          update: {},
          create: { name: normalized },
        });
        await prisma.clipTag.upsert({
          where: { clipId_tagId: { clipId: id, tagId: tag.id } },
          update: {},
          create: { clipId: id, tagId: tag.id, source: "USER" },
        });
      }
    }

    // Remove tags
    if (removeTags && removeTags.length > 0) {
      await prisma.clipTag.deleteMany({
        where: {
          clipId: id,
          tag: { name: { in: removeTags.map((t) => t.toLowerCase()) } },
        },
      });
    }

    // Return updated clip
    const clip = await prisma.clip.findFirst({
      where: { id, userId: user.id },
      include: {
        tags: { include: { tag: true } },
        entities: true,
      },
    });

    return NextResponse.json(clip);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clip update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    const existing = await prisma.clip.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    await prisma.clip.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clip delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
