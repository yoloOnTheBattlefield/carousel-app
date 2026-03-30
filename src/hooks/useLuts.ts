import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClientLut, LutData } from "@/types";
import api from "@/lib/api";

export function useLuts(clientId: string | undefined) {
  return useQuery<{ luts: ClientLut[] }>({
    queryKey: ["luts", clientId],
    queryFn: () =>
      api.get("/client-luts", { params: { client_id: clientId } }).then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useLutData(lutId: string | undefined) {
  return useQuery<LutData>({
    queryKey: ["lut-data", lutId],
    queryFn: () => api.get(`/client-luts/${lutId}/data`).then((r) => r.data),
    enabled: !!lutId,
    staleTime: Infinity,
  });
}

export function useUploadLut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, file }: { clientId: string; file: File }) => {
      const form = new FormData();
      form.append("client_id", clientId);
      form.append("lut", file);
      return api.post("/client-luts/upload", form).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["luts"] }),
  });
}

export function useDeleteLut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/client-luts/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["luts"] }),
  });
}
