import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

const createUserSchema = z
  .object({
    displayName: z.string().min(1),
    email: z.string().email().optional().nullable(),
    phoneE164: z.string().min(8).optional().nullable()
  })
  .refine((v) => v.email || v.phoneE164, {
    message: "Either email or phoneE164 is required"
  });

const updateUserSchema = z.object({
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phoneE164: z.string().min(8).optional().nullable()
});

const userIdParam = z.object({ id: z.string().uuid() });

export const usersRouter = Router();

usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createUserSchema.parse(req.body);
    const user = await prisma.user.create({ data: input });
    res.status(201).json(user);
  })
);

usersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = userIdParam.parse(req.params);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  })
);

usersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = userIdParam.parse(req.params);
    const input = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id }, data: input });
    res.json(user);
  })
);

usersRouter.get(
  "/:id/dashboard",
  asyncHandler(async (req, res) => {
    const { id } = userIdParam.parse(req.params);

    const [clips, wishlist, reading, quotes, flashcards, routines] = await Promise.all([
      prisma.clip.findMany({ where: { userId: id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.wishlistItem.findMany({ where: { userId: id }, include: { clipEntity: true }, orderBy: { createdAt: "desc" } }),
      prisma.readingListItem.findMany({ where: { userId: id }, include: { clipEntity: true }, orderBy: { createdAt: "desc" } }),
      prisma.quoteCard.findMany({ where: { userId: id }, include: { clipEntity: true }, orderBy: { createdAt: "desc" } }),
      prisma.flashcard.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" } }),
      prisma.routine.findMany({ where: { userId: id }, include: { items: true }, orderBy: { createdAt: "desc" } })
    ]);

    res.json({ clips, wishlist, reading, quotes, flashcards, routines });
  })
);
