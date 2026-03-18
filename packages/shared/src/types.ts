import type {
  Platform,
  ClipStatus,
  TagSource,
  EntityType,
} from "./constants";

export interface User {
  id: string;
  clerkId: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Clip {
  id: string;
  userId: string;
  originalUrl: string;
  canonicalUrl: string;
  platform: Platform;
  title: string | null;
  thumbnailUrl: string | null;
  authorName: string | null;
  authorHandle: string | null;
  durationSec: number | null;
  transcript: string | null;
  summary: string | null;
  keyTakeaways: string[];
  status: ClipStatus;
  failureReason: string | null;
  userNote: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: ClipTag[];
  entities?: Entity[];
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  _count?: { clips: number };
}

export interface ClipTag {
  clipId: string;
  tagId: string;
  source: TagSource;
  tag?: Tag;
}

export interface Entity {
  id: string;
  clipId: string;
  name: string;
  type: EntityType;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
