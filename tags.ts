import { TagType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

const createTagSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  type: z.nativeEnum(TagType).default(TagType.GENERIC),
  isPinned: z.boolean().optional()
});

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(TagType).optional(),
  isPinned: z.boolean().optional()
});

export const tagsRouter = Router();

tagsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createTagSchema.parse(req.body);
    const tag = await prisma.tag.create({ data: input });
    res.status(201).json(tag);
  })
);

tagsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.query);
    const tags = await prisma.tag.findMany({ where: { userId }, orderBy: [{ isPinned: "desc" }, { name: "asc" }] });
    res.json(tags);
  })
);

tagsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const input = updateTagSchema.parse(req.body);
    const tag = await prisma.tag.update({ where: { id }, data: input });
    res.json(tag);
  })
);

