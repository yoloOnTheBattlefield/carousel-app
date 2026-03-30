import { useState, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Badge } from "@quddify/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@quddify/ui/popover";
import { Upload, Trash2, Palette, ChevronsUpDown, Search, X } from "lucide-react";
import { useLuts, useUploadLut, useDeleteLut } from "@/hooks/useLuts";
import type { ClientLut } from "@/types";
import { cn } from "@quddify/ui";
import { toast } from "sonner";

function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1000) return (kb / 1024).toFixed(1) + "MB";
  return kb.toFixed(0) + "KB";
}

interface LutUploadProps {
  clientId: string;
  selectedLutId?: string | null;
  onSelect?: (lut: ClientLut | null) => void;
  compact?: boolean;
}

export function LutUpload({ clientId, selectedLutId, onSelect, compact }: LutUploadProps) {
  const { data, isLoading } = useLuts(clientId);
  const uploadLut = useUploadLut();
  const deleteLut = useDeleteLut();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const luts = data?.luts ?? [];

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

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
            onSuccess: (resp) => {
              toast.success(`Uploaded ${resp.lut.name}`);
            },
            onError: (err: unknown) => {
              const axiosErr = err as { response?: { data?: { error?: string } } };
              const msg = axiosErr?.response?.data?.error || (err instanceof Error ? err.message : "Unknown error");
              toast.error(`Failed to upload ${file.name}: ${msg}`);
              console.error("LUT upload error:", err);
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
      if (selectedLutId === id) onSelect?.(null);
      deleteLut.mutate(id, {
        onSuccess: () => toast.success("LUT deleted"),
      });
    },
    [deleteLut, selectedLutId, onSelect],
  );

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLut = luts.find((l) => l._id === selectedLutId) ?? null;

  const filteredLuts = useMemo(
    () =>
      search.trim()
        ? luts.filter((l) => l.name.toLowerCase().includes(search.trim().toLowerCase()))
        : luts,
    [luts, search],
  );

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex flex-1 items-center justify-between rounded-lg border border-[#222] bg-[#111] px-3 py-2 text-sm transition-colors hover:border-[#333] cursor-pointer"
              >
                {selectedLut ? (
                  <span className="flex items-center gap-2">
                    <Palette className="h-3.5 w-3.5 text-[#c9a84c]" />
                    <span>{selectedLut.name}</span>
                    <Badge variant="outline" className="text-[10px] ml-1">
                      {selectedLut.size}³
                    </Badge>
                  </span>
                ) : (
                  <span className="text-[#555]">No LUT selected</span>
                )}
                <ChevronsUpDown className="h-3.5 w-3.5 text-[#555]" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) p-0 border-[#222] bg-[#111]"
              align="start"
            >
              {/* Search */}
              <div className="flex items-center gap-2 border-b border-[#222] px-3 py-2">
                <Search className="h-3.5 w-3.5 text-[#555]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search LUTs..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#555]"
                  autoFocus
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="text-[#555] hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="max-h-50 overflow-y-auto p-1">
                {/* None option */}
                <button
                  type="button"
                  onClick={() => {
                    onSelect?.(null);
                    setDropdownOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer",
                    !selectedLutId ? "bg-[#c9a84c]/10 text-[#c9a84c]" : "text-[#888] hover:bg-[#1a1a1a]",
                  )}
                >
                  None
                </button>

                {isLoading ? (
                  <p className="px-2 py-3 text-xs text-[#555]">Loading LUTs...</p>
                ) : filteredLuts.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-[#555]">
                    {luts.length === 0 ? "No LUTs uploaded yet" : "No LUTs match your search"}
                  </p>
                ) : (
                  filteredLuts.map((lut) => (
                    <button
                      key={lut._id}
                      type="button"
                      onClick={() => {
                        onSelect?.(selectedLutId === lut._id ? null : lut);
                        setDropdownOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer",
                        selectedLutId === lut._id
                          ? "bg-[#c9a84c]/10 text-[#c9a84c]"
                          : "hover:bg-[#1a1a1a]",
                      )}
                    >
                      <Palette className="h-3 w-3" />
                      <span className="flex-1 text-left">{lut.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {lut.size}³
                      </Badge>
                    </button>
                  ))
                )}
              </div>

              {/* Upload from dropdown */}
              <div className="border-t border-[#222] p-1">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors cursor-pointer"
                >
                  <Upload className="h-3 w-3" />
                  Upload new LUT...
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {selectedLut && (
            <button
              type="button"
              onClick={() => onSelect?.(null)}
              className="rounded-lg border border-[#222] bg-[#111] px-2 text-[#555] hover:text-white hover:border-[#333] transition-colors cursor-pointer"
              title="Clear LUT"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".cube,.3dl"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {uploadLut.isPending && (
          <p className="text-xs text-[#555] animate-pulse">Uploading...</p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4 w-4" /> Color LUTs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/10 text-primary"
              : "border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:text-primary",
          )}
        >
          <Upload className="h-8 w-8" />
          <div>
            <p className="font-medium text-sm">
              {isDragging ? "Drop your LUT files here" : "Drag & drop LUT files here"}
            </p>
            <p className="text-xs mt-1">Supports .cube and .3dl formats</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".cube,.3dl"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {uploadLut.isPending && (
          <p className="text-sm text-muted-foreground animate-pulse">Uploading...</p>
        )}

        {/* LUT list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : luts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No LUTs uploaded yet. Upload .cube files to color grade your carousel images.</p>
        ) : (
          <div className="space-y-2">
            {luts.map((lut) => (
              <div
                key={lut._id}
                className={cn(
                  "flex items-center justify-between rounded-md border p-3 transition-colors",
                  selectedLutId === lut._id && "border-primary bg-primary/5",
                )}
              >
                <button
                  type="button"
                  className="flex items-center gap-3 text-left flex-1"
                  onClick={() => onSelect?.(selectedLutId === lut._id ? null : lut)}
                >
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{lut.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lut.format.toUpperCase()} · {lut.size}³ · {formatFileSize(lut.file_size)}
                    </p>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(lut._id)}
                  disabled={deleteLut.isPending}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
