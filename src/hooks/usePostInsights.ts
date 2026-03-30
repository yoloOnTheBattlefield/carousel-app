import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TrackedPost, ClientLearningProfile } from "@/types";
import api from "@/lib/api";

export function useTrackedPosts(clientId: string | undefined) {
  return useQuery<TrackedPost[]>({
    queryKey: ["tracked-posts", clientId],
    queryFn: () =>
      api
        .get("/post-insights/posts", { params: { client_id: clientId } })
        .then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useLearningProfile(clientId: string | undefined) {
  return useQuery<ClientLearningProfile | null>({
    queryKey: ["learning-profile", clientId],
    queryFn: () =>
      api
        .get("/post-insights/profile", { params: { client_id: clientId } })
        .then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useAddTrackedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { client_id: string; ig_url: string }) =>
      api.post("/post-insights/posts", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracked-posts"] });
      qc.invalidateQueries({ queryKey: ["learning-profile"] });
    },
  });
}

export function useAddTrackedPostsBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { client_id: string; ig_urls: string[] }) =>
      api.post("/post-insights/posts/bulk", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracked-posts"] });
      qc.invalidateQueries({ queryKey: ["learning-profile"] });
    },
  });
}

export function useDeleteTrackedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/post-insights/posts/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracked-posts"] });
      qc.invalidateQueries({ queryKey: ["learning-profile"] });
    },
  });
}

export function useReanalyzePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/post-insights/posts/${id}/reanalyze`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracked-posts"] });
      qc.invalidateQueries({ queryKey: ["learning-profile"] });
    },
  });
}

export function useRebuildLearningProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api
        .post("/post-insights/profile/rebuild", null, {
          params: { client_id: clientId },
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning-profile"] });
    },
  });
}
