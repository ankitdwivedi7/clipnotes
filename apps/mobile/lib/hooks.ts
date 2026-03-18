import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { TERMINAL_STATUSES } from "@clipnotes/shared";
import type { Clip, ClipStatus } from "@clipnotes/shared";
import * as api from "./api";
import { scheduleLocalNotification } from "./notifications";

export function useClips(filters?: { status?: string; tag?: string }) {
  return useInfiniteQuery({
    queryKey: ["clips", filters],
    queryFn: ({ pageParam }) =>
      api.fetchClips({ ...filters, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    // Auto-refresh every 3s while any clip is still processing
    refetchInterval: (query) => {
      const pages = query.state.data?.pages;
      if (!pages) return false;
      const hasProcessing = pages.some((page) =>
        page.data.some(
          (clip: Clip) => !TERMINAL_STATUSES.includes(clip.status as ClipStatus)
        )
      );
      return hasProcessing ? 3000 : false;
    },
  });
}

export function useClip(id: string) {
  return useQuery({
    queryKey: ["clip", id],
    queryFn: () => api.fetchClip(id),
  });
}

export function useClipPolling(id: string) {
  const prevStatus = { current: "" };
  return useQuery({
    queryKey: ["clip", id],
    queryFn: async () => {
      const clip = await api.fetchClip(id);
      // Notify when clip transitions to completed
      if (
        clip.status === "COMPLETED" &&
        prevStatus.current &&
        prevStatus.current !== "COMPLETED"
      ) {
        scheduleLocalNotification(
          "Clip ready!",
          clip.title || "Your clip has been processed"
        );
      }
      prevStatus.current = clip.status;
      return clip;
    },
    refetchInterval: (query) => {
      const clip = query.state.data as Clip | undefined;
      if (!clip) return 3000;
      return TERMINAL_STATUSES.includes(clip.status as ClipStatus)
        ? false
        : 3000;
    },
  });
}

export function useIngestClip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.ingestClip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
  });
}

export function useUpdateClip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateClip>[1] }) =>
      api.updateClip(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["clip", id] });
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
  });
}

export function useDeleteClip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteClip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      queryClient.invalidateQueries({ queryKey: ["userTags"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: api.fetchTags,
  });
}

export function useSearch(query: string) {
  return useInfiniteQuery({
    queryKey: ["search", query],
    queryFn: ({ pageParam }) =>
      api.searchClips({ q: query, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: query.length > 0,
  });
}

// --- User Tag Library ---

export function useUserTags() {
  return useQuery({
    queryKey: ["userTags"],
    queryFn: api.fetchUserTags,
  });
}

export function useCreateUserTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createUserTag(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTags"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteUserTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => api.deleteUserTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTags"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

// --- Stats ---

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: api.fetchStats,
    staleTime: 60_000, // 1 minute
  });
}

// --- Batch Operations ---

export function useBatchDeleteClips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.batchDeleteClips(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["userTags"] });
    },
  });
}

export function useBatchTagClips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, tagNames }: { ids: string[]; tagNames: string[] }) =>
      api.batchTagClips(ids, tagNames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
