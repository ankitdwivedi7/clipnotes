import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getOrCreateUser();

    const tags = await prisma.tag.findMany({
      where: {
        clips: { some: { clip: { userId: user.id } } },
      },
      include: {
        _count: { select: { clips: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
