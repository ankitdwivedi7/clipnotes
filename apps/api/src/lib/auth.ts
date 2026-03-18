import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "clipnotes-dev-secret-change-me";

export async function getOrCreateUser() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    // Try JWT auth first
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (user) return user;
    } catch {
      // Not a valid JWT — fall through to dev token check
    }

    // Dev mode fallback: accept "dev-token-*" tokens
    if (token.startsWith("dev-token-")) {
      const clerkId = "dev-user-1";
      return prisma.user.upsert({
        where: { clerkId },
        update: {},
        create: { clerkId },
      });
    }
  }

  // No auth header at all — use dev user in development
  if (process.env.NODE_ENV !== "production") {
    const clerkId = "dev-user-1";
    return prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: { clerkId },
    });
  }

  throw new Error("Unauthorized");
}
