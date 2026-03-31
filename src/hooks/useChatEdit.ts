import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChatEditResponse } from "@/types";
import api from "@/lib/api";

export function useChatEdit(carouselId: string) {
  const qc = useQueryClient();
  return useMutation<ChatEditResponse, Error, string>({
    mutationFn: (message) =>
      api.post(`/carousels/${carouselId}/chat-edit`, { message }).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(["carousels", "detail", carouselId], data.carousel);
    },
  });
}
