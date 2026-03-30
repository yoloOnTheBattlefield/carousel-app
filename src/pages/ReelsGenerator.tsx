import { useState, useRef, useCallback, useEffect } from "react";
import { useGenerateReels, type ReelResult } from "@/hooks/useReels";
import { Button } from "@quddify/ui/button";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { Card } from "@quddify/ui/card";
import { Slider } from "@quddify/ui/slider";
import { Upload, Plus, Trash2, Download, Loader2, Film, X, GripVertical } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_CAPTIONS = ["", "", "", "", ""];

export default function ReelsGenerator() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [captions, setCaptions] = useState<string[]>(DEFAULT_CAPTIONS);
  const [fontSize, setFontSize] = useState(64);
  // Text position as percentage (0-100) of the video frame
  const [textX, setTextX] = useState(50); // center horizontally
  const [textY, setTextY] = useState(50); // center vertically
  const [maxDuration, setMaxDuration] = useState(10);
  const [results, setResults] = useState<ReelResult[] | null>(null);
  const [previewCaption, setPreviewCaption] = useState(0); // which caption to preview
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const generateMutation = useGenerateReels();

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setResults(null);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const updateCaption = (index: number, value: string) => {
    setCaptions((prev) => prev.map((c, i) => (i === index ? value : c)));
  };

  const addCaption = () => {
    if (captions.length >= 10) {
      toast.error("Maximum 10 captions");
      return;
    }
    setCaptions((prev) => [...prev, ""]);
  };

  const removeCaption = (index: number) => {
    if (captions.length <= 1) return;
    setCaptions((prev) => prev.filter((_, i) => i !== index));
    if (previewCaption >= captions.length - 1) {
      setPreviewCaption(Math.max(0, captions.length - 2));
    }
  };

  // --- Drag-to-position logic ---
  const updatePositionFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = editorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      setTextX(Math.round(x * 10) / 10);
      setTextY(Math.round(y * 10) / 10);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePositionFromEvent(e.clientX, e.clientY);
    },
    [updatePositionFromEvent],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePositionFromEvent(e.clientX, e.clientY);
    },
    [isDragging, updatePositionFromEvent],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleGenerate = async () => {
    if (!videoFile) {
      toast.error("Upload a video first");
      return;
    }

    const validCaptions = captions.filter((c) => c.trim());
    if (validCaptions.length === 0) {
      toast.error("Add at least one caption");
      return;
    }

    try {
      const data = await generateMutation.mutateAsync({
        video: videoFile,
        captions: validCaptions,
        fontSize,
        textX,
        textY,
        maxDuration,
      });
      setResults(data.reels);
      toast.success(`${data.reels.length} reels generated!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Generation failed");
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setResults(null);
  };

  // The caption text to show in the preview
  const displayCaption = captions[previewCaption]?.trim() || "Your caption here";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reels Generator</h1>
        <p className="text-sm text-muted-foreground">
          Drop a B-roll video and generate multiple reels with different text captions.
          <span className="text-muted-foreground/60"> This tool is client-independent — select a client's page to use their branding.</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column – video editor + captions */}
        <div className="space-y-4">
          {/* Video upload / editor */}
          {!videoFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-12 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Drop your B-roll video here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Drag the text to position it
                </p>
                <button
                  onClick={clearVideo}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Change video
                </button>
              </div>

              {/* The visual editor */}
              <div
                ref={editorRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative cursor-crosshair select-none overflow-hidden rounded-lg border bg-black"
                style={{ touchAction: "none" }}
              >
                <video
                  src={videoPreview!}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="pointer-events-none w-full"
                  style={{ maxHeight: 500 }}
                />

                {/* Draggable text overlay */}
                <div
                  className="pointer-events-none absolute px-3 py-1"
                  style={{
                    left: `${textX}%`,
                    top: `${textY}%`,
                    transform: "translate(-50%, -50%)",
                    maxWidth: "90%",
                  }}
                >
                  <p
                    className="whitespace-pre-wrap text-center font-bold leading-tight text-white"
                    style={{
                      fontSize: `${fontSize / 3.5}px`, // scale down for preview (1080 → ~300px wide)
                      textShadow: "0 0 8px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)",
                      WebkitTextStroke: "0.5px rgba(0,0,0,0.3)",
                    }}
                  >
                    {displayCaption}
                  </p>
                </div>

                {/* Crosshair indicator */}
                <div
                  className="pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white/80"
                  style={{
                    left: `${textX}%`,
                    top: `${textY}%`,
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                  }}
                />
              </div>

              {/* Caption tabs for preview */}
              {captions.filter((c) => c.trim()).length > 1 && (
                <div className="flex gap-1">
                  {captions.map((c, i) =>
                    c.trim() ? (
                      <button
                        key={i}
                        onClick={() => setPreviewCaption(i)}
                        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                          previewCaption === i
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          )}

          {/* Captions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Captions</Label>
              <Button variant="outline" size="sm" onClick={addCaption}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            {captions.map((caption, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewCaption(i)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium transition-colors ${
                    previewCaption === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {i + 1}
                </button>
                <Input
                  value={caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  onFocus={() => setPreviewCaption(i)}
                  placeholder={`Caption for reel ${i + 1}...`}
                  className="flex-1"
                />
                {captions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCaption(i)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column – settings + generate */}
        <div className="space-y-4">
          <Card className="space-y-5 p-5">
            <h3 className="font-semibold">Settings</h3>

            <div className="space-y-2">
              <Label>
                Position: {textX.toFixed(0)}% x {textY.toFixed(0)}%
              </Label>
              <p className="text-xs text-muted-foreground">
                Click or drag on the video to place text
              </p>
            </div>

            <div className="space-y-2">
              <Label>Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                min={24}
                max={120}
                step={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Duration: {maxDuration}s</Label>
              <Slider
                value={[maxDuration]}
                onValueChange={([v]) => setMaxDuration(v)}
                min={3}
                max={60}
                step={1}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!videoFile || generateMutation.isPending}
              className="w-full"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Generate Reels
                </>
              )}
            </Button>
          </Card>

          {/* Results */}
          {results && (
            <Card className="space-y-3 p-5">
              <h3 className="font-semibold">Generated Reels</h3>
              {results.map((reel) => (
                <div
                  key={reel.index}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Reel {reel.index}</p>
                    <p className="truncate text-xs text-muted-foreground">{reel.caption}</p>
                  </div>
                  <a href={reel.url} download={reel.filename} className="ml-2">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
