import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ProspectProfile,
  ScrapeRequest,
  UpdateProfileRequest,
  OutreachGenerateRequest,
  Carousel,
  CarouselJob,
  ClientImage,
} from "@/types";
import api from "@/lib/api";

export function useProspectProfiles() {
  return useQuery<ProspectProfile[]>({
    queryKey: ["outreach", "profiles"],
    queryFn: () => api.get("/outreach").then((r) => r.data),
  });
}

export function useProspectProfile(profileId: string | undefined) {
  return useQuery<ProspectProfile>({
    queryKey: ["outreach", "profile", profileId],
    queryFn: () => api.get(`/outreach/${profileId}`).then((r) => r.data),
    enabled: !!profileId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "scraping" || status === "profiling" ? 3000 : false;
    },
  });
}

export function useProspectImages(profileId: string | undefined) {
  return useQuery<ClientImage[]>({
    queryKey: ["outreach", "images", profileId],
    queryFn: () => api.get(`/outreach/${profileId}/images`).then((r) => r.data),
    enabled: !!profileId,
  });
}

export function useScrapeProspect() {
  const qc = useQueryClient();
  return useMutation<{ profile_id: string; status: string }, Error, ScrapeRequest>({
    mutationFn: (data) => api.post("/outreach/scrape", data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["outreach", "profile", data.profile_id] });
    },
  });
}

export function useUpdateProspectProfile(profileId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<ProspectProfile, Error, UpdateProfileRequest>({
    mutationFn: (data) => api.put(`/outreach/${profileId}/profile`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outreach", "profile", profileId] });
    },
  });
}

export function useGenerateOutreachCarousel(profileId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<{ carousel: Carousel; job: CarouselJob }, Error, OutreachGenerateRequest>({
    mutationFn: (data) => {
      if (!profileId) throw new Error("No profile selected");
      return api.post(`/outreach/${profileId}/generate`, data).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carousels"] });
    },
  });
}

export function useCancelScrape(profileId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: () => api.post(`/outreach/${profileId}/cancel`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outreach", "profile", profileId] });
      qc.invalidateQueries({ queryKey: ["outreach", "profiles"] });
    },
  });
}

export function useDeleteProspectProfile() {
  const qc = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (profileId) => api.delete(`/outreach/${profileId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outreach"] });
    },
  });
}
