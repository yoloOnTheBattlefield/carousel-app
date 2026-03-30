import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SwipeFile } from "@/types";
import api from "@/lib/api";

export function useSwipeFiles(clientId: string | undefined) {
  return useQuery<SwipeFile[]>({
    queryKey: ["swipe-files", clientId],
    queryFn: () => api.get("/swipe-files", { params: { client_id: clientId } }).then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useCreateSwipeFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { client_id?: string; title: string; source_url?: string; source_type?: string }) =>
      api.post("/swipe-files", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["swipe-files"] }),
  });
}

export function useDeleteSwipeFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/swipe-files/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["swipe-files"] }),
  });
}
