import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transcript } from "@/types";
import api from "@/lib/api";

export function useTranscripts(clientId: string | undefined, opts?: { refetchInterval?: number | false | ((query: any) => number | false) }) {
  return useQuery<Transcript[]>({
    queryKey: ["transcripts", clientId],
    queryFn: () => api.get("/transcripts", { params: { client_id: clientId } }).then((r) => r.data),
    enabled: !!clientId,
    refetchInterval: opts?.refetchInterval as any,
  });
}

export function useTranscript(id: string | undefined) {
  return useQuery<Transcript>({
    queryKey: ["transcripts", "detail", id],
    queryFn: () => api.get(`/transcripts/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTranscript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { client_id: string; title: string; raw_text: string; call_type?: string; ai_model?: string }) =>
      api.post("/transcripts", data).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["transcripts", vars.client_id] });
    },
  });
}

export function useReanalyzeTranscript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ai_model }: { id: string; ai_model: string }) =>
      api.post(`/transcripts/${id}/reanalyze`, { ai_model }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transcripts"] }),
  });
}

export function useDeleteTranscript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transcripts/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transcripts"] }),
  });
}
