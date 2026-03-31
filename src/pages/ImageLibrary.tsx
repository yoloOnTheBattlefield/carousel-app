import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import { Images, Upload, Loader2, X, RefreshCw, Star, Tag, CheckSquare, Square, Trash2, Check, AlertTriangle } from "lucide-react";
import { useImages, useUploadImages, useTagVocabulary, useRetagImages, useRetryTagImages, useBulkDeleteImages, useUploadProgress } from "@/hooks/useImages";
import { useSelectedClient } from "@/contexts/ClientContext";
import { EmptyState } from "@/components/shared/EmptyState";
import { ImageGridSkeleton } from "@/components/shared/LoadingSkeleton";
import ImageTagEditor from "@/components/shared/ImageTagEditor";
import type { ClientImage } from "@/types";
import { useState, useRef, useMemo, useCallback } from "react";
import type { DragEvent } from "react";

const FILTER_CATEGORIES = [
  { key: "emotion", label: "Emotion" },
  { key: "vibe", label: "Vibe" },
  { key: "context", label: "Context" },
  { key: "activity", label: "Activity" },
  { key: "clothing", label: "Clothing" },
  { key: "lighting", label: "Lighting" },
  { key: "color_palette", label: "Color Palette" },
  { key: "composition", label: "Composition" },
] as const;

function formatTag(tag: string) {
  return tag.replace(/_/g, " ");
}

type UsageFilter = "all" | "unused" | "used";

export default function ImageLibrary() {
  const { selectedClientId: clientId } = useSelectedClient();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
  const [manualTagFilter, setManualTagFilter] = useState<string>("");
  const [editingImage, setEditingImage] = useState<ClientImage | null>(null);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showRetagConfirm, setShowRetagConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const { data, isLoading } = useImages(clientId ?? undefined, { ...filters, limit: "500" });
  const { data: tagVocab } = useTagVocabulary();
  const images = data?.images ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadImages();
  const retagMutation = useRetagImages();
  const retryTagMutation = useRetryTagImages();
  const bulkDeleteMutation = useBulkDeleteImages();
  const progress = useUploadProgress(images);

  const processingCount = images.filter((img) => img.status === "processing").length;
  const failedCount = images.filter((img) => img.status === "failed").length;
  const failedIds = images.filter((img) => img.status === "failed").map((img) => img._id);

  const handleUpload = useCallback((files: File[]) => {
    if (files.length === 0 || !clientId) return;
    progress.setIsUploading(true);
    progress.setUploadPercent(0);
    uploadMutation.mutate(
      {
        clientId,
        files,
        onProgress: (percent) => progress.setUploadPercent(percent),
      },
      {
        onSuccess: (data) => {
          progress.setIsUploading(false);
          progress.setUploadPercent(100);
          if (data.image_ids) {
            progress.startTracking(data.image_ids.length, data.image_ids);
          } else {
            progress.startTracking(files.length, []);
          }
        },
        onError: () => {
          progress.setIsUploading(false);
          progress.reset();
        },
      },
    );
  }, [clientId, uploadMutation, progress]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    handleUpload(files);
  }, [handleUpload]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (manualTagFilter ? 1 : 0);

  const filteredImages = images.filter((img) => {
    if (usageFilter === "unused" && img.total_uses !== 0) return false;
    if (usageFilter === "used" && img.total_uses === 0) return false;
    if (manualTagFilter && !(img.manual_tags ?? []).includes(manualTagFilter)) return false;
    return true;
  });

  const toggleSelect = useCallback((id: string, shiftKey?: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && prev.size > 0 && filteredImages.length > 0) {
        // Shift+click: select range from last selected to current
        const lastSelected = Array.from(prev).pop()!;
        const lastIdx = filteredImages.findIndex((img) => img._id === lastSelected);
        const currIdx = filteredImages.findIndex((img) => img._id === id);
        if (lastIdx !== -1 && currIdx !== -1) {
          const [start, end] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
          for (let i = start; i <= end; i++) {
            next.add(filteredImages[i]._id);
          }
          return next;
        }
      }
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [filteredImages]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredImages.map((img) => img._id)));
  }, [filteredImages]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

  // Collect all unique manual tags across images for the filter dropdown
  const allManualTags = useMemo(() => {
    const tagSet = new Set<string>();
    images.forEach((img) => img.manual_tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [images]);

  function clearFilters() {
    setFilters({});
    setManualTagFilter("");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 rounded bg-[#1a1a1a] animate-pulse" />
            <div className="h-4 w-64 mt-2 rounded bg-[#1a1a1a] animate-pulse" />
          </div>
        </div>
        <ImageGridSkeleton />
      </div>
    );
  }

  return (
    <div
      className="space-y-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Full-page drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-[#c9a84c] rounded-3xl p-16 flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-[#c9a84c]" />
            <p className="text-white text-[16px] font-medium">Drop photos to upload</p>
            <p className="text-[#888] text-[13px]">JPG, PNG, HEIC, WebP</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">
            Photo Vault
          </h1>
          <p className="text-[#555] text-[14px] mt-1">
            Upload your photos and AI will analyze them for content creation.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleUpload(files);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          {images.length > 0 && (
            <button
              onClick={() => {
                if (selectMode) {
                  clearSelection();
                } else {
                  setSelectMode(true);
                }
              }}
              className={`flex items-center gap-2 bg-[#111] border rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all cursor-pointer ${
                selectMode
                  ? "border-[#c9a84c] text-[#c9a84c]"
                  : "border-[#222] text-[#888] hover:border-[#333] hover:text-white"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          {images.length > 0 && (
            <>
              <button
                onClick={() => setShowRetagConfirm(true)}
                disabled={retagMutation.isPending}
                className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#888] hover:border-[#333] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                {retagMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Re-tagging...</>
                ) : (
                  <><RefreshCw className="h-4 w-4" /> Re-tag All</>
                )}
              </button>
              {showRetagConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRetagConfirm(false)}>
                  <div className="bg-[#111] border border-[#222] rounded-2xl p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-white text-[15px] font-semibold mb-2">Re-tag all images?</h3>
                    <p className="text-[#888] text-[13px] mb-4">
                      This will re-analyze {images.length} image{images.length !== 1 ? "s" : ""} with AI. Images will show as "processing" until done.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowRetagConfirm(false)}
                        className="px-4 py-2 text-[13px] text-[#888] hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (clientId) retagMutation.mutate(clientId);
                          setShowRetagConfirm(false);
                        }}
                        className="px-4 py-2 bg-[#c9a84c] text-black text-[13px] font-semibold rounded-xl hover:bg-[#d4b55a] transition-colors cursor-pointer"
                      >
                        Re-tag {images.length} images
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-2 bg-[#c9a84c] text-black font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#d4b55a] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {uploadMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Images</>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Upload Zone */}
      {showUploadZone && (
        <div
          className="border border-dashed border-[#333] rounded-2xl bg-[#111] flex flex-col items-center justify-center py-10 cursor-pointer hover:border-[#444] transition-colors relative"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowUploadZone(false); }}
            className="absolute top-3 right-3 text-[#555] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="w-11 h-11 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center mb-3">
            <Upload className="w-5 h-5 text-[#555]" />
          </div>
          <p className="text-white text-[14px] font-medium">
            Drag and drop photos here, or click to upload
          </p>
          <p className="text-[#444] text-[12px] mt-1.5">
            JPG, PNG, HEIC, WebP — up to 25MB each
          </p>
        </div>
      )}
      {!showUploadZone && images.length > 0 && (
        <button
          onClick={() => setShowUploadZone(true)}
          className="flex items-center gap-1.5 text-[12px] text-[#555] hover:text-[#888] transition-colors cursor-pointer"
        >
          <Upload className="h-3 w-3" /> Show upload area
        </button>
      )}
      {!showUploadZone && images.length === 0 && (
        <div
          className="border border-dashed border-[#333] rounded-2xl bg-[#111] flex flex-col items-center justify-center py-10 cursor-pointer hover:border-[#444] transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="w-11 h-11 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center mb-3">
            <Upload className="w-5 h-5 text-[#555]" />
          </div>
          <p className="text-white text-[14px] font-medium">
            Drag and drop photos here, or click to upload
          </p>
          <p className="text-[#444] text-[12px] mt-1.5">
            JPG, PNG, HEIC, WebP — up to 25MB each
          </p>
        </div>
      )}

      {/* Upload & Processing Progress */}
      {(progress.isUploading || progress.totalInBatch > 0) && (
        <div className="rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Upload progress */}
            {progress.isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5 text-[#c9a84c]" />
                    <span className="text-[13px] text-[#c9a84c] font-medium">Uploading files...</span>
                  </div>
                  <span className="text-[12px] text-[#c9a84c]/70 tabular-nums">{progress.uploadPercent}%</span>
                </div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c9a84c] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress.uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Processing progress */}
            {progress.totalInBatch > 0 && !progress.isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {progress.isComplete ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c9a84c]" />
                    )}
                    <span className={`text-[13px] font-medium ${progress.isComplete ? "text-emerald-400" : "text-[#c9a84c]"}`}>
                      {progress.isComplete
                        ? `All ${progress.totalInBatch} images processed`
                        : `Analyzing images — ${progress.processedCount} of ${progress.totalInBatch} done`}
                    </span>
                  </div>
                  <span className={`text-[12px] tabular-nums ${progress.isComplete ? "text-emerald-400/70" : "text-[#c9a84c]/70"}`}>
                    {Math.round((progress.processedCount / progress.totalInBatch) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${progress.isComplete ? "bg-emerald-400" : "bg-[#c9a84c]"}`}
                    style={{ width: `${(progress.processedCount / progress.totalInBatch) * 100}%` }}
                  />
                </div>

                {/* Per-image status list */}
                {!progress.isComplete && progress.totalInBatch <= 20 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {images
                      .filter((img) => progress.newlyReady.has(img._id) || (progress.totalInBatch > 0 && img.status !== "ready"))
                      .slice(0, 12)
                      .map((img) => (
                        <div
                          key={img._id}
                          className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border ${
                            img.status === "ready"
                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                              : "border-[#222] bg-[#111] text-[#666]"
                          }`}
                        >
                          {img.status === "ready" ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          <span className="max-w-25 truncate">{img.original_filename}</span>
                          {img.status === "ready" && <Tag className="h-2.5 w-2.5 text-emerald-400/60" />}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dismiss button when complete */}
          {progress.isComplete && (
            <button
              onClick={progress.reset}
              className="w-full py-2 text-[12px] text-[#555] hover:text-white border-t border-[#222] transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Status Messages */}
      {retagMutation.isSuccess && (
        <div className="flex items-center rounded-xl border border-[#222] bg-[#111] p-3 text-[13px] text-[#888]">
          <span>Re-tagging {retagMutation.data.queued} images. Images will show as "processing" until done.</span>
          <button onClick={() => retagMutation.reset()} className="ml-auto text-[#555] hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {uploadMutation.isError && (
        <div className="rounded-xl border border-[#e84057]/20 bg-[#e84057]/5 p-3 text-[13px] text-[#e84057]">
          Upload failed. Please try again.
        </div>
      )}

      {/* Processing Banner (for non-upload processing, e.g. retag) */}
      {processingCount > 0 && !progress.totalInBatch && (
        <div className="flex items-center gap-3 rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 p-3">
          <Loader2 className="h-4 w-4 animate-spin text-[#c9a84c] shrink-0" />
          <span className="text-[13px] text-[#c9a84c]">
            {processingCount} image{processingCount !== 1 ? "s" : ""} being analyzed by AI...
          </span>
        </div>
      )}

      {/* Failed Tagging Banner */}
      {failedCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-[#e84057]/20 bg-[#e84057]/5 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#e84057] shrink-0" />
            <span className="text-[13px] text-[#e84057]">
              {failedCount} image{failedCount !== 1 ? "s" : ""} couldn't be tagged — photos are saved, just untagged.
            </span>
          </div>
          <button
            onClick={() => retryTagMutation.mutate(failedIds)}
            disabled={retryTagMutation.isPending}
            className="flex items-center gap-1.5 bg-[#e84057]/10 border border-[#e84057]/30 text-[#e84057] hover:bg-[#e84057]/20 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            {retryTagMutation.isPending ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Retrying...</>
            ) : (
              <><RefreshCw className="h-3 w-3" /> Retry Tagging</>
            )}
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-[#c9a84c]">
              {selectedIds.size} selected
            </span>
            <button
              onClick={selectAll}
              className="text-[12px] text-[#888] hover:text-white transition-colors cursor-pointer"
            >
              Select all ({filteredImages.length})
            </button>
            <button
              onClick={clearSelection}
              className="text-[12px] text-[#888] hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                bulkDeleteMutation.mutate(Array.from(selectedIds), {
                  onSuccess: () => clearSelection(),
                });
              }}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-1.5 text-[12px] text-[#e84057] hover:text-[#ff5070] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {bulkDeleteMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="h-3.5 w-3.5" /> Delete {selectedIds.size}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Tag Filter Dropdowns */}
          {FILTER_CATEGORIES.slice(0, 3).map(({ key, label }) => {
            const options = tagVocab?.[key] ?? [];
            return (
              <Select
                key={key}
                value={filters[key] || "all"}
                onValueChange={(v) => setFilters({ ...filters, [key]: v === "all" ? "" : v ?? "" })}
              >
                <SelectTrigger className="h-9 w-auto min-w-[120px] bg-[#111] border-[#222] rounded-xl text-[13px] text-[#888] hover:border-[#333] transition-colors [&>svg]:text-[#555]">
                  <SelectValue placeholder={`All ${label}s`} />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#222] rounded-xl">
                  <SelectItem value="all" className="text-[13px] text-[#888]">All {label}s</SelectItem>
                  {options.map((tag) => (
                    <SelectItem key={tag} value={tag} className="text-[13px] text-[#ccc] capitalize">{formatTag(tag)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}

          {/* Manual Tag Filter */}
          {allManualTags.length > 0 && (
            <Select
              value={manualTagFilter || "all"}
              onValueChange={(v) => setManualTagFilter(v === "all" ? "" : v ?? "")}
            >
              <SelectTrigger className="h-9 w-auto min-w-[120px] bg-[#111] border-[#222] rounded-xl text-[13px] text-[#888] hover:border-[#333] transition-colors [&>svg]:text-[#555]">
                <Tag className="h-3.5 w-3.5 mr-1.5 text-[#c9a84c]" />
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#222] rounded-xl">
                <SelectItem value="all" className="text-[13px] text-[#888]">All Tags</SelectItem>
                {allManualTags.map((tag) => (
                  <SelectItem key={tag} value={tag} className="text-[13px] text-[#ccc] capitalize">{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Usage Filter Toggle */}
          <div className="flex bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            {(["all", "unused", "used"] as UsageFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setUsageFilter(f)}
                className={`px-4 py-2 text-[12px] font-medium capitalize transition-colors cursor-pointer ${
                  usageFilter === f
                    ? "bg-white text-black"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[12px] text-[#555] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Image Count */}
        {data?.total && (
          <span className="text-[13px] text-[#444]">
            {filteredImages.length} of {data.total} images
          </span>
        )}
      </div>

      {/* More Filters (collapsed row) */}
      {FILTER_CATEGORIES.length > 3 && (
        <div className="flex flex-wrap gap-2.5">
          {FILTER_CATEGORIES.slice(3).map(({ key, label }) => {
            const options = tagVocab?.[key] ?? [];
            return (
              <Select
                key={key}
                value={filters[key] || "all"}
                onValueChange={(v) => setFilters({ ...filters, [key]: v === "all" ? "" : v ?? "" })}
              >
                <SelectTrigger className="h-9 w-auto min-w-[120px] bg-[#111] border-[#222] rounded-xl text-[13px] text-[#888] hover:border-[#333] transition-colors [&>svg]:text-[#555]">
                  <SelectValue placeholder={`All ${label}s`} />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-[#222] rounded-xl">
                  <SelectItem value="all" className="text-[13px] text-[#888]">All</SelectItem>
                  {options.map((tag) => (
                    <SelectItem key={tag} value={tag} className="text-[13px] text-[#ccc] capitalize">{formatTag(tag)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })}
        </div>
      )}

      {/* Photo Grid */}
      {filteredImages.length === 0 ? (
        <EmptyState
          icon={<Images className="h-10 w-10 text-[#333]" />}
          title={activeFilterCount > 0 || usageFilter !== "all" ? "No images match filters" : "No images yet"}
          description={activeFilterCount > 0 || usageFilter !== "all" ? "Try adjusting your filters" : "Upload images to get started"}
        />
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredImages.map((img) => (
            <div
              key={img._id}
              className={`relative rounded-2xl overflow-hidden bg-[#111] border group cursor-pointer hover:border-[#333] transition-all ${
                selectedIds.has(img._id) ? "border-[#c9a84c] ring-1 ring-[#c9a84c]/30" : "border-[#222]"
              } ${progress.newlyReady.has(img._id) ? "animate-in fade-in zoom-in-95 duration-500" : ""}`}
              style={{ aspectRatio: "9/11" }}
              onClick={(e) => {
                if (selectMode) {
                  toggleSelect(img._id, e.shiftKey);
                }
              }}
            >
              <img
                src={img.thumbnail_url}
                alt={img.original_filename}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />

              {/* Selection checkbox */}
              {selectMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(img._id, e.shiftKey);
                  }}
                  className="absolute top-3 left-3 z-10 cursor-pointer"
                >
                  {selectedIds.has(img._id) ? (
                    <CheckSquare className="h-5 w-5 text-[#c9a84c] fill-[#c9a84c]/20" />
                  ) : (
                    <Square className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
                  )}
                </button>
              )}

              {/* Used Badge */}
              {img.total_uses > 0 && (
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-[#888] text-[10px] font-medium px-2 py-0.5 rounded-lg border border-[#333]/50">
                  Used {img.total_uses}x
                </div>
              )}

              {/* AI Badge */}
              {img.is_ai_generated && (
                <div className="absolute top-3 right-3 bg-[#c9a84c]/20 backdrop-blur-sm text-[#c9a84c] text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                  AI
                </div>
              )}

              {/* Untagged Badge */}
              {img.status === "failed" && (
                <div className="absolute top-3 right-3 bg-[#e84057]/20 backdrop-blur-sm text-[#e84057] text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                  Untagged
                </div>
              )}

              {/* Tag Button (visible on hover) */}
              <button
                onClick={() => setEditingImage(img)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-black/70 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-black/90 transition-all cursor-pointer"
                style={img.is_ai_generated ? { right: "auto", left: "12px", top: "auto", bottom: "auto" } : {}}
              >
                <Tag className="h-3.5 w-3.5" />
              </button>

              {/* Status indicator for processing */}
              {img.status === "processing" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <Loader2 className="h-3 w-3 animate-spin text-[#c9a84c]" />
                    <span className="text-[11px] text-[#888]">Analyzing...</span>
                  </div>
                </div>
              )}

              {/* Failed tagging indicator */}
              {img.status === "failed" && (
                <div className="absolute inset-0 bg-black/30 flex items-end justify-center pb-14">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      retryTagMutation.mutate([img._id]);
                    }}
                    disabled={retryTagMutation.isPending}
                    className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-[#e84057] px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-black/90 transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry Tag
                  </button>
                </div>
              )}

              {/* Bottom Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
                {/* Quality Score */}
                <div className="flex items-center gap-1 mb-1.5">
                  <Star className="w-3 h-3 text-[#c9a84c] fill-[#c9a84c]" />
                  <span className="text-white text-[12px] font-medium">
                    {img.quality_score}/10
                  </span>
                </div>

                {/* Manual Tags */}
                {(img.manual_tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {img.manual_tags.slice(0, 3).map((tag) => (
                      <span
                        key={`m-${tag}`}
                        className="bg-[#c9a84c]/20 backdrop-blur-sm text-[#c9a84c] text-[10px] font-medium px-1.5 py-0.5 rounded capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                    {img.manual_tags.length > 3 && (
                      <span className="text-[#c9a84c]/60 text-[10px] px-1">
                        +{img.manual_tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* AI Tags */}
                <div className="flex flex-wrap gap-1">
                  {img.tags.emotion?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#333]/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded capitalize"
                    >
                      {formatTag(tag)}
                    </span>
                  ))}
                  {img.tags.vibe?.slice(0, 2).map((tag) => (
                    <span
                      key={`v-${tag}`}
                      className="bg-[#333]/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded capitalize"
                    >
                      {formatTag(tag)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tag Editor Modal */}
      {editingImage && (
        <ImageTagEditor
          image={editingImage}
          onClose={() => setEditingImage(null)}
        />
      )}
    </div>
  );
}
