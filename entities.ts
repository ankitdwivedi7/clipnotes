import { EntityType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";

export const entitiesRouter = Router();

entitiesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const input = z
      .object({
        clipId: z.string().uuid().optional(),
        entityType: z.nativeEnum(EntityType).optional()
      })
      .parse(req.query);

    const entities = await prisma.clipEntity.findMany({
      where: {
        clipId: input.clipId,
        entityType: input.entityType
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(entities);
  })
);
