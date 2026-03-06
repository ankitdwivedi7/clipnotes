import { ClipSource, ClipStatus, IngestPlatform, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

const clipSourceSchema = z.nativeEnum(ClipSource);
const clipStatusSchema = z.nativeEnum(ClipStatus);

const createClipSchema = z.object({
  userId: z.string().uuid(),
  canonicalUrl: z.string().url(),
  source: clipSourceSchema,
  sourceVideoId: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  ingestEvent: z
    .object({
      platform: z.nativeEnum(IngestPlatform),
      rawSharedText: z.string().optional().nullable(),
      rawUrl: z.string().url().optional().nullable(),
      noteAtCapture: z.string().optional().nullable(),
      clientEventId: z.string().optional().nullable()
    })
    .optional()
});

const updateClipSchema = z.object({
  title: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  status: clipStatusSchema.optional(),
  lastErrorCode: z.string().optional().nullable(),
  lastErrorMessage: z.string().optional().nullable(),
  archivedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable()
});

const listClipQuery = z.object({
  userId: z.string().uuid(),
  status: clipStatusSchema.optional(),
  includeArchived: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().optional()
});

const clipIdParam = z.object({ id: z.string().uuid() });

const createClipEntitySchema = z.object({
  entityType: z.enum(["PRODUCT", "BOOK", "CONCEPT", "EXERCISE", "QUOTE"]),
  displayText: z.string().min(1),
  dataJson: z.any().optional(),
  confidence: z.number().min(0).max(1).optional().nullable()
});

const createNoteSchema = z.object({
  userId: z.string().uuid(),
  noteText: z.string().min(1)
});

export const clipsRouter = Router();

clipsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createClipSchema.parse(req.body);

    const clip = await prisma.$transaction(async (tx) => {
      const created = await tx.clip.create({
        data: {
          userId: input.userId,
          canonicalUrl: input.canonicalUrl,
          source: input.source,
          sourceVideoId: input.sourceVideoId,
          title: input.title,
          author: input.author,
          thumbnailUrl: input.thumbnailUrl,
          durationSeconds: input.durationSeconds
        }
      });

      if (input.ingestEvent) {
        await tx.clipIngestEvent.create({
          data: {
            clipId: created.id,
            userId: input.userId,
            ...input.ingestEvent
          }
        });
      }

      return created;
    });

    res.status(201).json(clip);
  })
);

clipsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const input = listClipQuery.parse(req.query);
    const where: Prisma.ClipWhereInput = {
      userId: input.userId,
      status: input.status,
      archivedAt: input.includeArchived ? undefined : null,
      deletedAt: input.includeDeleted ? undefined : null
    };

    const clips = await prisma.clip.findMany({
      where,
      include: {
        clipTags: { include: { tag: true } },
        entities: true,
        notes: true,
        summaryVersions: { where: { isCurrent: true }, take: 1 }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(clips);
  })
);

clipsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = clipIdParam.parse(req.params);

    const clip = await prisma.clip.findUnique({
      where: { id },
      include: {
        ingestEvents: true,
        processingRuns: true,
        transcripts: true,
        summaryVersions: { orderBy: { createdAt: "desc" } },
        entities: true,
        notes: true,
        clipTags: { include: { tag: true } }
      }
    });

    if (!clip) return res.status(404).json({ error: "Clip not found" });
    res.json(clip);
  })
);

clipsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = clipIdParam.parse(req.params);
    const input = updateClipSchema.parse(req.body);
    const clip = await prisma.clip.update({ where: { id }, data: input });
    res.json(clip);
  })
);

clipsRouter.post(
  "/:id/notes",
  asyncHandler(async (req, res) => {
    const { id } = clipIdParam.parse(req.params);
    const input = createNoteSchema.parse(req.body);

    const note = await prisma.userNote.create({
      data: {
        userId: input.userId,
        clipId: id,
        noteText: input.noteText
      }
    });

    res.status(201).json(note);
  })
);

clipsRouter.post(
  "/:id/entities",
  asyncHandler(async (req, res) => {
    const { id } = clipIdParam.parse(req.params);
    const input = createClipEntitySchema.parse(req.body);

    const entity = await prisma.clipEntity.create({
      data: {
        clipId: id,
        entityType: input.entityType,
        displayText: input.displayText,
        dataJson: input.dataJson,
        confidence: input.confidence
      }
    });

    res.status(201).json(entity);
  })
);

clipsRouter.post(
  "/:id/tags/:tagId",
  asyncHandler(async (req, res) => {
    const parsed = z.object({ id: z.string().uuid(), tagId: z.string().uuid() }).parse(req.params);

    const clipTag = await prisma.clipTag.upsert({
      where: { clipId_tagId: { clipId: parsed.id, tagId: parsed.tagId } },
      update: {},
      create: {
        clipId: parsed.id,
        tagId: parsed.tagId
      }
    });

    res.status(201).json(clipTag);
  })
);
