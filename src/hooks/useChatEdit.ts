import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Carousel } from "@/types";

interface ChatEditResponse {
  carousel: Carousel;
  updated_slides: Array<{ position: number; copy: string }>;
  assistant_message: string;
}

export function useChatEdit() {
  const qc = useQueryClient();
  return useMutation<ChatEditResponse, Error, { carouselId: string; message: string }>({
    mutationFn: ({ carouselId, message }) =>
      api
        .post(`/carousels/${carouselId}/chat-edit`, { message })
        .then((r) => r.data),
    onSuccess: (data, vars) => {
      qc.setQueryData(["carousels", "detail", vars.carouselId], data.carousel);
      qc.invalidateQueries({ queryKey: ["carousels", "detail", vars.carouselId] });
    },
  });
}
