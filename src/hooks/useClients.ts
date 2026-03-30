import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client } from "@/types";
import api from "@/lib/api";

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.get("/clients").then((r) => r.data),
  });
}

export function useClient(id: string | undefined) {
  return useQuery<Client>({
    queryKey: ["clients", id],
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) => api.post("/clients", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      api.patch(`/clients/${id}`, data).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients", vars.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useInstagramAuthUrl(clientId: string | undefined) {
  return useQuery<{ url: string }>({
    queryKey: ["ig-auth-url", clientId],
    queryFn: () => api.get(`/instagram/client/${clientId}/auth-url`).then((r) => r.data),
    enabled: false,
  });
}

export function useConnectInstagram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, code }: { clientId: string; code: string }) =>
      api.post(`/instagram/client/${clientId}/callback`, { code }).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["clients", vars.clientId] });
    },
  });
}

export function useDisconnectInstagram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api.delete(`/instagram/client/${clientId}/disconnect`).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["clients", vars] });
    },
  });
}

export function useCloneClientSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetId, sourceId, fields }: { targetId: string; sourceId: string; fields?: string[] }) =>
      api.post(`/clients/${targetId}/clone-settings-from/${sourceId}`, { fields }).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients", vars.targetId] });
    },
  });
}
