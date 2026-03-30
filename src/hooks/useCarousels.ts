import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Carousel, CarouselJob, CarouselGoal, ContentType, LayoutPreset, SlideComposition } from "@/types";
import api from "@/lib/api";

export function useCarousels(clientId: string | undefined) {
  return useQuery<Carousel[]>({
    queryKey: ["carousels", clientId],
    queryFn: () => api.get("/carousels", { params: { client_id: clientId } }).then((r) => r.data),
    enabled: !!clientId,
  });
}

export function useCarousel(id: string | undefined) {
  return useQuery<Carousel>({
    queryKey: ["carousels", "detail", id],
    queryFn: () => api.get(`/carousels/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCarouselJob(carouselId: string | undefined) {
  return useQuery<CarouselJob>({
    queryKey: ["carousel-jobs", carouselId],
    queryFn: () => api.get(`/carousels/${carouselId}/job`).then((r) => r.data),
    enabled: !!carouselId,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job && (job.status === "completed" || job.status === "failed")) return false;
      return 2000;
    },
  });
}

export function useGenerateCarousel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      client_id: string;
      content_type?: ContentType;
      transcript_ids: string[];
      swipe_file_id?: string | null;
      template_id?: string | null;
      lut_id?: string | null;
      goal?: CarouselGoal;
      copy_model?: "claude-sonnet" | "claude-opus" | "gpt-4o";
      style_id?: string | null;
      style_prompt_override?: string | null;
      layout_preset?: LayoutPreset;
      include_caption?: boolean;
      use_learning_profile?: boolean;
    }) => api.post("/carousels/generate", data).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["carousels", vars.client_id] });
    },
  });
}

export function useApplyLut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ carouselId, lutId }: { carouselId: string; lutId: string }) =>
      api.post(`/carousels/${carouselId}/apply-lut`, { lut_id: lutId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carousels"] });
    },
  });
}

export function useRegenerateCarousel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ carouselId, lutId }: { carouselId: string; lutId?: string | null }) =>
      api.post(`/carousels/${carouselId}/regenerate`, { lut_id: lutId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carousels"] });
      qc.invalidateQueries({ queryKey: ["carousel-jobs"] });
    },
  });
}

export function useRerenderSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      carouselId,
      position,
      composition,
      image_id,
      extra_image_ids,
    }: {
      carouselId: string;
      position: number;
      composition: SlideComposition;
      image_id?: string;
      extra_image_ids?: string[];
    }) =>
      api
        .post(`/carousels/${carouselId}/slides/${position}/rerender`, {
          composition,
          image_id,
          extra_image_ids,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carousels"] });
    },
  });
}

export function useUpdateSlideCopy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      carouselId,
      position,
      copy,
    }: {
      carouselId: string;
      position: number;
      copy: string;
    }) =>
      api
        .patch(`/carousels/${carouselId}/slides/${position}`, { copy })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carousels"] });
    },
  });
}

export function usePublishToInstagram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (carouselId: string) =>
      api.post(`/carousels/${carouselId}/publish-ig`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carousels"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
