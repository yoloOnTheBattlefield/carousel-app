import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ReelResult {
  index: number;
  caption: string;
  url: string;
  filename: string;
}

export interface GenerateReelsResponse {
  batchId: string;
  reels: ReelResult[];
}

interface GenerateReelsParams {
  video: File;
  captions: string[];
  fontSize?: number;
  textX?: number;  // 0-100 percentage
  textY?: number;  // 0-100 percentage
  maxDuration?: number;
}

export function useGenerateReels() {
  return useMutation({
    mutationFn: async (params: GenerateReelsParams): Promise<GenerateReelsResponse> => {
      const formData = new FormData();
      formData.append("video", params.video);
      formData.append("captions", JSON.stringify(params.captions));
      if (params.fontSize) formData.append("fontSize", String(params.fontSize));
      if (params.textX != null) formData.append("textX", String(params.textX));
      if (params.textY != null) formData.append("textY", String(params.textY));
      if (params.maxDuration) formData.append("maxDuration", String(params.maxDuration));

      const { data } = await api.post("/reels/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300_000,
      });
      return data;
    },
  });
}
