import { useParams } from "react-router-dom";
import { Card, CardContent } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Badge } from "@quddify/ui/badge";
import { Upload, Trash2, Palette, Loader2 } from "lucide-react";
import { useLuts, useUploadLut, useDeleteLut, useLutData } from "@/hooks/useLuts";
import { useImages } from "@/hooks/useImages";
import { LutPreview } from "@/components/carousel/LutPreview";
import type { ClientLut } from "@/types";
import { useState, useCallback, useRef } from "react";
import { cn } from "@quddify/ui";
import { toast } from "sonner";

function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1000) return (kb / 1024).toFixed(1) + "MB";
  return kb.toFixed(0) + "KB";
}

function LutCard({
  lut,
  sampleImageSrc,
  onDelete,
  isDeleting,
}: {
  lut: ClientLut;
  sampleImageSrc: string | null;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { data: lutData } = useLutData(lut._id);
  const [hover, setHover] = useState(false);

  return (
    <Card
      className="overflow-hidden group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="aspect-4/5 bg-muted relative">
        {sampleImageSrc ? (
          <>
            {/* Show LUT preview by default, original on hover */}
            {lutData && (
              <div
                className={cn(
                  "absolute inset-0 transition-opacity duration-300",
                  hover ? "opacity-0" : "opacity-100",
                )}
              >
                <LutPreview
                  imageSrc={sampleImageSrc}
                  lutData={lutData}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <img
              src={sampleImageSrc}
              alt="Original"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                hover || !lutData ? "opacity-100" : "opacity-0",
              )}
            />
            {/* Label */}
            <div
              className={cn(
                "absolute top-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white transition-opacity",
                hover ? "opacity-100" : "opacity-0",
              )}
            >
              Original
            </div>
            {lutData && !hover && (
              <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                With LUT
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Palette className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight break-words" title={lut.name}>{lut.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className="text-[10px]">
                {lut.format.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {lut.size}&sup3;
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {formatFileSize(lut.file_size)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(lut._id)}
            disabled={isDeleting}
            className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LutLibrary() {
  const { id: clientId } = useParams<{ id: string }>();
  const { data, isLoading } = useLuts(clientId);
  const { data: imageData } = useImages(clientId, { limit: "1" });
  const uploadLut = useUploadLut();
  const deleteLut = useDeleteLut();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const luts = data?.luts ?? [];

  // Use the first client image as preview sample
  const sampleImage = imageData?.images?.[0];
  const sampleImageSrc = sampleImage
    ? `/uploads/${sampleImage.thumbnail_key || sampleImage.storage_key}`
    : null;

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0 || !clientId) return;

      for (const file of fileArray) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext !== "cube" && ext !== "3dl") {
          toast.error(`${file.name}: Only .cube and .3dl files are supported`);
          continue;
        }
        toast.info(`Uploading ${file.name}...`);
        uploadLut.mutate(
          { clientId, file },
          {
            onSuccess: (resp) => toast.success(`Uploaded ${resp.lut.name}`),
            onError: (err: unknown) => {
              const axiosErr = err as { response?: { data?: { error?: string } } };
              const msg =
                axiosErr?.response?.data?.error ||
                (err instanceof Error ? err.message : "Unknown error");
              toast.error(`Failed to upload ${file.name}: ${msg}`);
            },
          },
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientId],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteLut.mutate(id, {
        onSuccess: () => toast.success("LUT deleted"),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Color LUTs</h1>
          <p className="text-sm text-muted-foreground">
            Upload .cube or .3dl LUT files to color grade your carousel images.
            {sampleImageSrc && " Hover a card to see the original."}
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploadLut.isPending}>
          {uploadLut.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload LUT
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".cube,.3dl"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Drop zone — shown when no LUTs or always as a subtle area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => luts.length === 0 && fileInputRef.current?.click()}
        className={cn(
          "rounded-lg border-2 border-dashed transition-colors",
          isDragging
            ? "border-primary bg-primary/10"
            : luts.length === 0
              ? "border-muted-foreground/25 cursor-pointer hover:border-primary/50"
              : "border-transparent",
          luts.length === 0 ? "p-12" : "p-2",
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : luts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
            <Palette className="h-12 w-12" />
            <div>
              <p className="font-medium text-foreground">No LUTs uploaded yet</p>
              <p className="text-sm mt-1">
                Drag & drop .cube or .3dl files here, or click to browse
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {luts.map((lut) => (
              <LutCard
                key={lut._id}
                lut={lut}
                sampleImageSrc={sampleImageSrc}
                onDelete={handleDelete}
                isDeleting={deleteLut.isPending}
              />
            ))}

          </div>
        )}
      </div>

      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
          <div className="rounded-lg border-2 border-dashed border-primary bg-primary/10 p-12 text-center">
            <Upload className="mx-auto h-12 w-12 text-primary" />
            <p className="mt-3 text-lg font-medium text-primary">Drop your LUT files here</p>
          </div>
        </div>
      )}
    </div>
  );
}
