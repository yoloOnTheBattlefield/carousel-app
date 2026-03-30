import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CarouselTemplate } from "@/types";
import api from "@/lib/api";

export function useTemplates(clientId?: string) {
  return useQuery<CarouselTemplate[]>({
    queryKey: ["templates", clientId],
    queryFn: () =>
      api.get("/carousel-templates", { params: clientId ? { client_id: clientId } : {} }).then((r) => r.data),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CarouselTemplate>) =>
      api.post("/carousel-templates", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/carousel-templates/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useCloneTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, clientId }: { id: string; name?: string; clientId?: string }) =>
      api.post(`/carousel-templates/${id}/clone`, { name, client_id: clientId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}
