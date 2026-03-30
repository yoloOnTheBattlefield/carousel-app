import api from "../api";
import type { Carousel, CarouselJob, CarouselGoal, ContentType, LayoutPreset, SlideComposition } from "@/types";

export interface GenerateCarouselPayload {
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
}

export const carouselsApi = {
  list: (clientId: string) =>
    api.get<Carousel[]>("/carousels", { params: { client_id: clientId } }).then((r) => r.data),
  get: (id: string) => api.get<Carousel>(`/carousels/${id}`).then((r) => r.data),
  getJob: (carouselId: string) => api.get<CarouselJob>(`/carousels/${carouselId}/job`).then((r) => r.data),
  generate: (data: GenerateCarouselPayload) => api.post("/carousels/generate", data).then((r) => r.data),
  applyLut: (carouselId: string, lutId: string) =>
    api.post(`/carousels/${carouselId}/apply-lut`, { lut_id: lutId }).then((r) => r.data),
  regenerate: (carouselId: string, lutId?: string | null) =>
    api.post(`/carousels/${carouselId}/regenerate`, { lut_id: lutId }).then((r) => r.data),
  rerenderSlide: (carouselId: string, position: number, composition: SlideComposition, imageId?: string, extraImageIds?: string[]) =>
    api.post(`/carousels/${carouselId}/slides/${position}/rerender`, { composition, image_id: imageId, extra_image_ids: extraImageIds }).then((r) => r.data),
  updateSlideCopy: (carouselId: string, position: number, copy: string) =>
    api.patch(`/carousels/${carouselId}/slides/${position}`, { copy }).then((r) => r.data),
  publishToInstagram: (carouselId: string) =>
    api.post(`/carousels/${carouselId}/publish-ig`).then((r) => r.data),
};
