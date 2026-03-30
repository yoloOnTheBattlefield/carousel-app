import api from "../api";
import type { Client } from "@/types";

export const clientsApi = {
  list: () => api.get<Client[]>("/clients").then((r) => r.data),
  get: (id: string) => api.get<Client>(`/clients/${id}`).then((r) => r.data),
  create: (data: Partial<Client>) => api.post("/clients", data).then((r) => r.data),
  update: (id: string, data: Partial<Client>) => api.patch(`/clients/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
  cloneSettings: (targetId: string, sourceId: string, fields?: string[]) =>
    api.post(`/clients/${targetId}/clone-settings-from/${sourceId}`, { fields }).then((r) => r.data),
};

export const instagramApi = {
  getAuthUrl: (clientId: string) =>
    api.get<{ url: string }>(`/instagram/client/${clientId}/auth-url`).then((r) => r.data),
  callback: (clientId: string, code: string) =>
    api.post(`/instagram/client/${clientId}/callback`, { code }).then((r) => r.data),
  disconnect: (clientId: string) =>
    api.delete(`/instagram/client/${clientId}/disconnect`).then((r) => r.data),
};
