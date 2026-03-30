import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface CarouselStyle {
  _id: string;
  name: string;
  style_prompt: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useCarouselStyles() {
  return useQuery<CarouselStyle[]>({
    queryKey: ["carousel-styles"],
    queryFn: () => api.get("/carousel-styles").then((r) => r.data),
  });
}

export function useCreateCarouselStyle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; style_prompt: string }) =>
      api.post("/carousel-styles", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carousel-styles"] }),
  });
}

export function useUpdateCarouselStyle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; style_prompt?: string }) =>
      api.patch(`/carousel-styles/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carousel-styles"] }),
  });
}

export function useDeleteCarouselStyle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/carousel-styles/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carousel-styles"] }),
  });
}

export function useCloneCarouselStyle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      api.post(`/carousel-styles/${id}/clone`, { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["carousel-styles"] }),
  });
}
