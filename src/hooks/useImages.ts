import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { ClientImage } from "@/types";
import api from "@/lib/api";

interface ImageListResponse {
  images: ClientImage[];
  total: number;
  page: number;
  limit: number;
}

export type TagVocabulary = Record<string, string[]>;

export function useImages(clientId: string | undefined, params?: Record<string, string>) {
  return useQuery<ImageListResponse>({
    queryKey: ["images", clientId, params],
    queryFn: () =>
      api.get("/client-images", { params: { client_id: clientId, ...params } }).then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useTagVocabulary() {
  return useQuery<TagVocabulary>({
    queryKey: ["tag-vocabulary"],
    queryFn: () => api.get("/client-images/tags").then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useUploadImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, files }: { clientId: string; files: File[] }) => {
      const form = new FormData();
      form.append("client_id", clientId);
      files.forEach((f) => form.append("images", f));
      return api.post("/client-images/upload", form).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function useRetagImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api.post("/client-images/retag", { client_id: clientId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function useUpdateImageManualTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, manual_tags }: { id: string; manual_tags: string[] }) =>
      api.patch(`/client-images/${id}`, { manual_tags }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function useDeleteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/client-images/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}
