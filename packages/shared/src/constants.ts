export const Platform = {
  YOUTUBE_SHORTS: "YOUTUBE_SHORTS",
  INSTAGRAM_REELS: "INSTAGRAM_REELS",
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const ClipStatus = {
  QUEUED: "QUEUED",
  FETCHING_METADATA: "FETCHING_METADATA",
  EXTRACTING_TRANSCRIPT: "EXTRACTING_TRANSCRIPT",
  SUMMARIZING: "SUMMARIZING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type ClipStatus = (typeof ClipStatus)[keyof typeof ClipStatus];

export const TagSource = {
  USER: "USER",
  AI_SUGGESTED: "AI_SUGGESTED",
} as const;
export type TagSource = (typeof TagSource)[keyof typeof TagSource];

export const EntityType = {
  PERSON: "PERSON",
  PRODUCT: "PRODUCT",
  BRAND: "BRAND",
  PLACE: "PLACE",
  CONCEPT: "CONCEPT",
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const TERMINAL_STATUSES: ClipStatus[] = [
  ClipStatus.COMPLETED,
  ClipStatus.FAILED,
];
