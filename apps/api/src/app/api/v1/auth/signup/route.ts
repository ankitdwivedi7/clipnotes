import { NextRequest, NextResponse } from "next/server";
import { hash as bcryptHash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "clipnotes-dev-secret-change-me";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.toLowerCase().trim();
    const password = body.password as string;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcryptHash(password, 12);

    const user = await prisma.user.create({
      data: {
        clerkId: `email-${email}`, // backwards compat — use email as unique identifier
        email,
        passwordHash,
      },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "30d",
    });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
