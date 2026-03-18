import { z } from "zod";
import { Platform } from "./constants";

export const ingestRequestSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  note: z.string().max(500).optional(),
});
export type IngestRequest = z.infer<typeof ingestRequestSchema>;

export const ingestResponseSchema = z.object({
  clipId: z.string(),
  status: z.string(),
  duplicate: z.boolean().optional(),
});
export type IngestResponse = z.infer<typeof ingestResponseSchema>;

export const clipsQuerySchema = z.object({
  status: z.string().optional(),
  tag: z.string().optional(),
  platform: z.nativeEnum(Platform).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});
export type ClipsQuery = z.infer<typeof clipsQuerySchema>;

export const clipUpdateSchema = z.object({
  userNote: z.string().max(500).nullish(),
  addTags: z.array(z.string().min(1).max(50)).max(10).optional(),
  removeTags: z.array(z.string()).optional(),
});
export type ClipUpdate = z.infer<typeof clipUpdateSchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  tag: z.string().optional(),
  platform: z.nativeEnum(Platform).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;
