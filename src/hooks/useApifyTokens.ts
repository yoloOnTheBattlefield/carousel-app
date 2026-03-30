import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ApifyToken {
  _id: string;
  label?: string;
  token: string;
  status: string;
}

export interface ApifyTokenUsage {
  _id: string;
  totalUsageUsd?: number | null;
  usageCycle?: { startAt: string; endAt: string } | null;
  monthlyUsageLimitUsd?: number | null;
  error?: string;
}

export function useApifyTokens() {
  return useQuery<{ tokens: ApifyToken[] }>({
    queryKey: ["apify-tokens"],
    queryFn: () => api.get("/apify-tokens").then((r) => r.data),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useApifyUsage(enabled: boolean) {
  return useQuery<{ usage: ApifyTokenUsage[] }>({
    queryKey: ["apify-tokens-usage"],
    queryFn: () => api.get("/apify-tokens/usage").then((r) => r.data),
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAddApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { label?: string; token: string }) =>
      api.post("/apify-tokens", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}

export function useDeleteApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/apify-tokens/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}

export function useResetApifyToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/apify-tokens/${id}/reset`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apify-tokens"] }),
  });
}
