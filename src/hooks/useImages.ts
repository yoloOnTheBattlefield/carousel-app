import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { ClientImage } from "@/types";
import api from "@/lib/api";

interface ImageListResponse {
  images: ClientImage[];
  total: number;
  page: number;
  limit: number;
}

export type TagVocabulary = Record<string, string[]>;

export interface UploadProgress {
  /** 0-100, file transfer progress */
  uploadPercent: number;
  /** Total images being processed in this batch */
  totalInBatch: number;
  /** How many have finished processing (status === 'ready') */
  processedCount: number;
  /** IDs of images that just became ready (for animation) */
  newlyReady: Set<string>;
  /** Whether upload + processing is fully complete */
  isComplete: boolean;
  /** Whether the file transfer is still in progress */
  isUploading: boolean;
}

export function useImages(clientId: string | undefined, params?: Record<string, string>) {
  const query = useQuery<ImageListResponse>({
    queryKey: ["images", clientId, params],
    queryFn: () =>
      api.get("/client-images", { params: { client_id: clientId, ...params } }).then((r) => r.data),
    enabled: !!clientId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.images?.some((img) => img.status !== "ready")) return 2000;
      return false;
    },
  });
  return query;
}

export function useUploadProgress(images: ClientImage[]): UploadProgress & { startTracking: (count: number, ids: string[]) => void; reset: () => void; setUploadPercent: (p: number) => void; setIsUploading: (v: boolean) => void } {
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [totalInBatch, setTotalInBatch] = useState(0);
  const prevReadyRef = useRef<Set<string>>(new Set());
  const [newlyReady, setNewlyReady] = useState<Set<string>>(new Set());

  const startTracking = useCallback((count: number, ids: string[]) => {
    setTotalInBatch(count);
    setBatchIds(ids);
    setNewlyReady(new Set());
    prevReadyRef.current = new Set();
  }, []);

  const reset = useCallback(() => {
    setUploadPercent(0);
    setIsUploading(false);
    setBatchIds([]);
    setTotalInBatch(0);
    setNewlyReady(new Set());
    prevReadyRef.current = new Set();
  }, []);

  const batchIdSet = useMemo(() => new Set(batchIds), [batchIds]);

  // Track which batch images have become ready
  useEffect(() => {
    if (batchIdSet.size === 0) return;
    const batchImages = images.filter((img) => batchIdSet.has(img._id));
    const readyNow = new Set(batchImages.filter((img) => img.status === "ready").map((img) => img._id));

    // Find newly ready ones
    const justBecameReady = new Set<string>();
    readyNow.forEach((id) => {
      if (!prevReadyRef.current.has(id)) justBecameReady.add(id);
    });

    if (justBecameReady.size > 0) {
      setNewlyReady((prev) => {
        const next = new Set(prev);
        justBecameReady.forEach((id) => next.add(id));
        return next;
      });
    }

    prevReadyRef.current = readyNow;

    // Auto-reset when all done
    if (readyNow.size === batchIdSet.size && batchIdSet.size > 0) {
      const timer = setTimeout(reset, 5000);
      return () => clearTimeout(timer);
    }
  }, [images, batchIdSet, reset]);

  const processedCount = batchIdSet.size > 0
    ? images.filter((img) => batchIdSet.has(img._id) && img.status === "ready").length
    : 0;

  const isComplete = totalInBatch > 0 && processedCount === totalInBatch;

  return { uploadPercent, totalInBatch, processedCount, newlyReady, isComplete, isUploading, startTracking, reset, setUploadPercent, setIsUploading };
}

export function useTagVocabulary() {
  return useQuery<TagVocabulary>({
    queryKey: ["tag-vocabulary"],
    queryFn: () => api.get("/client-images/tags").then((r) => r.data),
    staleTime: Infinity,
  });
}

const CHUNK_SIZE = 5;

export function useUploadImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, files, onProgress }: { clientId: string; files: File[]; onProgress?: (percent: number) => void }) => {
      const allImageIds: string[] = [];
      let totalUploaded = 0;
      let totalFailed = 0;

      for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        const form = new FormData();
        form.append("client_id", clientId);
        chunk.forEach((f) => form.append("images", f));

        const res = await api.post("/client-images/upload", form, {
          timeout: 600000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          onUploadProgress: (e) => {
            if (e.total) {
              const chunkProgress = e.loaded / e.total;
              const overallProgress = ((i + chunk.length * chunkProgress) / files.length) * 100;
              onProgress?.(Math.round(overallProgress));
            }
          },
        });

        const data = res.data;
        totalUploaded += data.uploaded;
        totalFailed += data.failed;
        if (data.image_ids) allImageIds.push(...data.image_ids);

        // Invalidate after each chunk so images appear incrementally
        qc.invalidateQueries({ queryKey: ["images"] });
      }

      return { uploaded: totalUploaded, failed: totalFailed, image_ids: allImageIds };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function useRetagImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api.post("/client-images/retag", { client_id: clientId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function useRetryTagImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageIds: string[]) =>
      api.post("/client-images/retry-tag", { image_ids: imageIds }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function useUpdateImageManualTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, manual_tags }: { id: string; manual_tags: string[] }) =>
      api.patch(`/client-images/${id}`, { manual_tags }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function useDeleteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/client-images/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}

export function useBulkDeleteImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageIds: string[]) =>
      api.post("/client-images/bulk-delete", { image_ids: imageIds }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["images"] }),
  });
}
