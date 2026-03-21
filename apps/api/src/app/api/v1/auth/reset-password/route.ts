import { NextRequest, NextResponse } from "next/server";
import { hash as bcryptHash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "clipnotes-dev-secret-change-me";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.toLowerCase().trim();
    const newPassword = body.newPassword as string;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      // Don't reveal whether account exists
      return NextResponse.json(
        { error: "If an account with this email exists, the password has been reset" },
        { status: 200 }
      );
    }

    // Hash new password and update
    const passwordHash = await bcryptHash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Auto-login after password reset
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "30d",
    });

    return NextResponse.json({
      message: "Password reset successfully",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
