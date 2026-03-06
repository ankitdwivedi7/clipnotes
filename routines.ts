import { EntityType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

const uuid = z.string().uuid();

const createRoutineSchema = z.object({
  userId: uuid,
  name: z.string().min(1),
  scheduleJson: z.any().optional()
});

const addRoutineItemSchema = z.object({
  clipEntityId: uuid,
  orderIndex: z.number().int().min(0),
  prescriptionJson: z.any().optional()
});

export const routinesRouter = Router();

routinesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createRoutineSchema.parse(req.body);
    const routine = await prisma.routine.create({ data: input });
    res.status(201).json(routine);
  })
);

routinesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = z.object({ userId: uuid }).parse(req.query);
    const routines = await prisma.routine.findMany({
      where: { userId },
      include: { items: { include: { clipEntity: true }, orderBy: { orderIndex: "asc" } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(routines);
  })
);

routinesRouter.post(
  "/:id/items",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: uuid }).parse(req.params);
    const input = addRoutineItemSchema.parse(req.body);

    const entity = await prisma.clipEntity.findUnique({ where: { id: input.clipEntityId }, select: { entityType: true } });
    if (!entity || entity.entityType !== EntityType.EXERCISE) {
      return res.status(400).json({ error: "clipEntityId must point to EXERCISE entity" });
    }

    const item = await prisma.routineItem.create({ data: { ...input, routineId: id } });
    res.status(201).json(item);
  })
);

routinesRouter.patch(
  "/items/:id",
  asyncHandler(async (req, res) => {
    const { id } = z.object({ id: uuid }).parse(req.params);
    const input = z
      .object({
        orderIndex: z.number().int().min(0).optional(),
        prescriptionJson: z.any().optional()
      })
      .parse(req.body);

    const item = await prisma.routineItem.update({ where: { id }, data: input });
    res.json(item);
  })
);
