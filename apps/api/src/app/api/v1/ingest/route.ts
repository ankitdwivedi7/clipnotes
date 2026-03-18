import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clipProcessingQueue } from "@/lib/queue";
import { getOrCreateUser } from "@/lib/auth";
import { ingestRequestSchema, parseClipUrl } from "@clipnotes/shared";

export async function POST(request: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await request.json();
    const parsed = ingestRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url, tags, note } = parsed.data;

    const parsedUrl = parseClipUrl(url);
    if (!parsedUrl) {
      return NextResponse.json(
        { error: "Unsupported URL. Only YouTube Shorts and Instagram Reels are supported." },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.clip.findUnique({
      where: {
        userId_canonicalUrl: {
          userId: user.id,
          canonicalUrl: parsedUrl.canonicalUrl,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { clipId: existing.id, status: existing.status, duplicate: true },
        { status: 409 }
      );
    }

    // Create clip
    const clip = await prisma.clip.create({
      data: {
        userId: user.id,
        originalUrl: url,
        canonicalUrl: parsedUrl.canonicalUrl,
        platform: parsedUrl.platform,
        userNote: note || null,
      },
    });

    // Create user-provided tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const normalized = tagName.toLowerCase().trim();
        const tag = await prisma.tag.upsert({
          where: { name: normalized },
          update: {},
          create: { name: normalized },
        });
        await prisma.clipTag.create({
          data: { clipId: clip.id, tagId: tag.id, source: "USER" },
        });
      }
    }

    // Queue processing job
    await clipProcessingQueue.add("process-clip", { clipId: clip.id });

    return NextResponse.json(
      { clipId: clip.id, status: clip.status },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
