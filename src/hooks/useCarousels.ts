import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Carousel, CarouselJob, GenerateRequest } from "@/types";
import api from "@/lib/api";

export function useCarousels(clientId?: string) {
  return useQuery<Carousel[]>({
    queryKey: ["carousels", clientId],
    queryFn: () =>
      api.get("/carousels", { params: clientId ? { client_id: clientId } : {} }).then((r) => r.data),
  });
}

export function useCarousel(id: string | undefined) {
  return useQuery<Carousel>({
    queryKey: ["carousels", "detail", id],
    queryFn: () => api.get(`/carousels/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "generating" ? 3000 : false;
    },
  });
}

export function useCarouselJob(carouselId: string | undefined) {
  return useQuery<CarouselJob>({
    queryKey: ["carousel-job", carouselId],
    queryFn: () => api.get(`/carousels/${carouselId}/job`).then((r) => r.data),
    enabled: !!carouselId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 2000 : false;
    },
  });
}

export function useGenerateCarousel() {
  const qc = useQueryClient();
  return useMutation<{ carousel: Carousel; job: CarouselJob }, Error, GenerateRequest>({
    mutationFn: (data) => api.post("/carousels/generate-from-topic", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carousels"] }),
  });
}

export function useDeleteCarousel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/carousels/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carousels"] }),
  });
}

export function useRegenerateCarousel() {
  const qc = useQueryClient();
  return useMutation<{ carousel: Carousel; job: CarouselJob }, Error, string>({
    mutationFn: (id) => api.post(`/carousels/${id}/regenerate`).then((r) => r.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["carousels", "detail", id] });
      qc.invalidateQueries({ queryKey: ["carousel-job", id] });
    },
  });
}
