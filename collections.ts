import { EntityType, ReadingStatus, WishlistStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

const uuid = z.string().uuid();

const createWishlistSchema = z.object({
  userId: uuid,
  clipEntityId: uuid,
  status: z.nativeEnum(WishlistStatus).optional(),
  note: z.string().optional().nullable()
});

const createReadingSchema = z.object({
  userId: uuid,
  clipEntityId: uuid,
  status: z.nativeEnum(ReadingStatus).optional(),
  startedAt: z.coerce.date().optional().nullable(),
  finishedAt: z.coerce.date().optional().nullable()
});

const createQuoteSchema = z.object({
  userId: uuid,
  clipEntityId: uuid,
  pinned: z.boolean().optional(),
  reminderSchedule: z.any().optional()
});

const createFlashcardSchema = z.object({
  userId: uuid,
  clipId: uuid,
  clipEntityId: uuid.optional().nullable(),
  front: z.string().min(1),
  back: z.string().min(1),
  easeFactor: z.number().int().optional().nullable()
});

export const collectionsRouter = Router();

collectionsRouter.post(
  "/wishlist",
  asyncHandler(async (req, res) => {
    const input = createWishlistSchema.parse(req.body);

    const entity = await prisma.clipEntity.findUnique({ where: { id: input.clipEntityId }, select: { entityType: true } });
    if (!entity || entity.entityType !== EntityType.PRODUCT) {
      return res.status(400).json({ error: "clipEntityId must point to PRODUCT entity" });
    }

    const item = await prisma.wishlistItem.create({ data: input });
    res.status(201).json(item);
  })
);

collectionsRouter.post(
  "/reading",
  asyncHandler(async (req, res) => {
    const input = createReadingSchema.parse(req.body);

    const entity = await prisma.clipEntity.findUnique({ where: { id: input.clipEntityId }, select: { entityType: true } });
    if (!entity || entity.entityType !== EntityType.BOOK) {
      return res.status(400).json({ error: "clipEntityId must point to BOOK entity" });
    }

    const item = await prisma.readingListItem.create({ data: input });
    res.status(201).json(item);
  })
);

collectionsRouter.post(
  "/quotes",
  asyncHandler(async (req, res) => {
    const input = createQuoteSchema.parse(req.body);

    const entity = await prisma.clipEntity.findUnique({ where: { id: input.clipEntityId }, select: { entityType: true } });
    if (!entity || entity.entityType !== EntityType.QUOTE) {
      return res.status(400).json({ error: "clipEntityId must point to QUOTE entity" });
    }

    const item = await prisma.quoteCard.create({ data: input });
    res.status(201).json(item);
  })
);

collectionsRouter.post(
  "/flashcards",
  asyncHandler(async (req, res) => {
    const input = createFlashcardSchema.parse(req.body);

    if (input.clipEntityId) {
      const entity = await prisma.clipEntity.findUnique({ where: { id: input.clipEntityId }, select: { entityType: true } });
      if (!entity || entity.entityType !== EntityType.CONCEPT) {
        return res.status(400).json({ error: "clipEntityId must point to CONCEPT entity" });
      }
    }

    const item = await prisma.flashcard.create({ data: input });
    res.status(201).json(item);
  })
);

collectionsRouter.get(
  "/:type",
  asyncHandler(async (req, res) => {
    const { type } = z.object({ type: z.enum(["wishlist", "reading", "quotes", "flashcards"]) }).parse(req.params);
    const { userId } = z.object({ userId: uuid }).parse(req.query);

    if (type === "wishlist") {
      return res.json(await prisma.wishlistItem.findMany({ where: { userId }, include: { clipEntity: true } }));
    }
    if (type === "reading") {
      return res.json(await prisma.readingListItem.findMany({ where: { userId }, include: { clipEntity: true } }));
    }
    if (type === "quotes") {
      return res.json(await prisma.quoteCard.findMany({ where: { userId }, include: { clipEntity: true } }));
    }

    return res.json(await prisma.flashcard.findMany({ where: { userId }, include: { clipEntity: true, clip: true } }));
  })
);
