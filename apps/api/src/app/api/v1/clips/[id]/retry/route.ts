import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { clipProcessingQueue } from "@/lib/queue";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    const clip = await prisma.clip.findFirst({
      where: { id, userId: user.id },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    if (clip.status !== "FAILED") {
      return NextResponse.json(
        { error: "Only failed clips can be retried" },
        { status: 400 }
      );
    }

    // Reset clip status to QUEUED and clear failure reason
    await prisma.clip.update({
      where: { id },
      data: {
        status: "QUEUED",
        failureReason: null,
        summary: null,
        keyTakeaways: [],
      },
    });

    // Re-add to processing queue
    await clipProcessingQueue.add("process-clip", { clipId: id });

    return NextResponse.json({ success: true, status: "QUEUED" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clip retry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
