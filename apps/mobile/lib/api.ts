import Constants from "expo-constants";
import type {
  Clip,
  Tag,
  PaginatedResponse,
  IngestResponse,
  IngestRequest,
  ClipUpdate,
} from "@clipnotes/shared";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000";

let getTokenFn: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getTokenFn ? await getTokenFn() : null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as Record<string, string>).error || `API error ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

// --- API functions ---

export function fetchClips(params?: {
  status?: string;
  tag?: string;
  cursor?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.tag) query.set("tag", params.tag);
  if (params?.cursor) query.set("cursor", params.cursor);
  if (params?.limit) query.set("limit", String(params.limit));
  return apiFetch<PaginatedResponse<Clip>>(`/api/v1/clips?${query}`);
}

export function fetchClip(id: string) {
  return apiFetch<Clip>(`/api/v1/clips/${id}`);
}

export function ingestClip(data: IngestRequest) {
  return apiFetch<IngestResponse>("/api/v1/ingest", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateClip(id: string, data: ClipUpdate) {
  return apiFetch<Clip>(`/api/v1/clips/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteClip(id: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/clips/${id}`, {
    method: "DELETE",
  });
}

export function retryClip(id: string) {
  return apiFetch<{ success: boolean; status: string }>(
    `/api/v1/clips/${id}/retry`,
    { method: "POST" }
  );
}

export function fetchTags() {
  return apiFetch<Tag[]>("/api/v1/tags");
}

export function searchClips(params: {
  q: string;
  tag?: string;
  cursor?: string;
  limit?: number;
}) {
  const query = new URLSearchParams({ q: params.q });
  if (params.tag) query.set("tag", params.tag);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  return apiFetch<PaginatedResponse<Clip>>(`/api/v1/search?${query}`);
}

// --- User Tag Library ---

export interface UserTagItem {
  id: string;
  name: string;
  _count: { clips: number };
  addedAt: string;
}

export function fetchUserTags() {
  return apiFetch<UserTagItem[]>("/api/v1/user-tags");
}

export function createUserTag(name: string) {
  return apiFetch<{ id: string; name: string }>("/api/v1/user-tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteUserTag(tagId: string) {
  return apiFetch<{ success: boolean }>(`/api/v1/user-tags?tagId=${tagId}`, {
    method: "DELETE",
  });
}

// --- Stats ---

export interface StatsResponse {
  totalClips: number;
  completedClips: number;
  failedClips: number;
  processingClips: number;
  totalTags: number;
  topTags: Array<{ name: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
  platforms: Array<{ platform: string; count: number }>;
}

export function fetchStats() {
  return apiFetch<StatsResponse>("/api/v1/stats");
}

// --- Batch operations ---

export function batchDeleteClips(ids: string[]) {
  return apiFetch<{ deleted: number }>("/api/v1/clips/batch", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
}

export function batchTagClips(ids: string[], tagNames: string[]) {
  return apiFetch<{ updated: number }>("/api/v1/clips/batch", {
    method: "PATCH",
    body: JSON.stringify({ ids, addTags: tagNames }),
  });
}
