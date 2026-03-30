import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ThumbnailJob, ThumbnailTemplate } from "@/types";
import api from "@/lib/api";

export function useThumbnails(clientId: string | undefined) {
  return useQuery<ThumbnailJob[]>({
    queryKey: ["thumbnails", clientId],
    queryFn: () => api.get("/thumbnails", { params: { client_id: clientId } }).then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useThumbnailJob(jobId: string | undefined) {
  return useQuery<ThumbnailJob>({
    queryKey: ["thumbnail-jobs", jobId],
    queryFn: () => api.get(`/thumbnails/jobs/${jobId}`).then((r) => r.data),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job && (job.status === "completed" || job.status === "failed")) return false;
      return 2000;
    },
  });
}

export function useGenerateThumbnails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { client_id: string; topic: string; headshot_image_id: string; template_id?: string; reference_urls?: string[] }) =>
      api.post("/thumbnails/generate", data).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["thumbnails", vars.client_id] });
    },
  });
}

export function useThumbnailTemplates() {
  return useQuery<ThumbnailTemplate[]>({
    queryKey: ["thumbnail-templates"],
    queryFn: () => api.get("/thumbnail-templates").then((r) => r.data),
  });
}

export function useIterateThumbnail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, label, feedback }: { jobId: string; label: string; feedback: string }) =>
      api.post(`/thumbnails/${jobId}/iterate`, { label, feedback }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thumbnail-jobs"] });
    },
  });
}
