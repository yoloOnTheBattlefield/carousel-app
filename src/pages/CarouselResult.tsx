import { useParams, Link } from "react-router-dom";
import { Progress } from "@quddify/ui/progress";
import { Download, Copy, ArrowLeft, Palette, Loader2, RefreshCw, Instagram, Star, Pencil, ChevronLeft, ChevronRight, Search, Check, ChevronsUpDown, Smartphone, Monitor } from "lucide-react";
import { useCarousel, useApplyLut, useRegenerateCarousel, useCarouselJob, usePublishToInstagram, useUpdateSlideCopy } from "@/hooks/useCarousels";
import { SlideTextEditor, defaultTextOverlaySettings, type TextOverlaySettings } from "@/components/carousel/SlideTextEditor";
import { useLuts, useLutData } from "@/hooks/useLuts";
import { ConfidenceBadge } from "@/components/carousel/ConfidenceBadge";
import { LutPreview } from "@/components/carousel/LutPreview";
import { SlideCompositionSwitcher } from "@/components/carousel/SlideCompositionSwitcher";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ClientLut } from "@/types";
import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@quddify/ui";
import { toast } from "sonner";

export default function CarouselResult() {
  const { id: clientId, carouselId } = useParams<{ id: string; carouselId: string }>();
  const { data: carousel, isLoading } = useCarousel(carouselId);
  const { data: lutsData } = useLuts(clientId);
  const { data: job } = useCarouselJob(carouselId);
  const applyLut = useApplyLut();
  const regenerate = useRegenerateCarousel();
  const publishIg = usePublishToInstagram();
  const updateCopy = useUpdateSlideCopy();
  const [activeSlide, setActiveSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewLutId, setPreviewLutId] = useState<string | undefined>(undefined);
  const [overlaySettings, setOverlaySettings] = useState<Record<number, TextOverlaySettings>>({});
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [lutSearchOpen, setLutSearchOpen] = useState(false);
  const [lutSearch, setLutSearch] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);
  const lutDropdownRef = useRef<HTMLDivElement>(null);
  const { data: previewLutData } = useLutData(previewLutId);
  const thumbStripRef = useRef<HTMLDivElement>(null);

  const scrollThumbs = useCallback((direction: "left" | "right") => {
    if (!thumbStripRef.current) return;
    const amount = 300;
    thumbStripRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  // Close LUT dropdown on outside click
  useEffect(() => {
    if (!lutSearchOpen) return;
    function handleClick(e: MouseEvent) {
      if (lutDropdownRef.current && !lutDropdownRef.current.contains(e.target as Node)) {
        setLutSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [lutSearchOpen]);

  const luts = lutsData?.luts ?? [];

  const copyCaption = useCallback(() => {
    if (!carousel) return;
    const body = carousel.caption.replace(/\s*#\w+/g, "").trim();
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [carousel]);

  if (isLoading || !carousel) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#444]" />
      </div>
    );
  }

  if (carousel.status !== "ready") {
    const isRegenerating = carousel.status === "queued" || carousel.status === "generating";
    return (
      <div className="py-16 max-w-md mx-auto text-center">
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
          <StatusBadge status={carousel.status} />
          <p className="text-[#555] text-[14px] mt-3">Carousel is {carousel.status}</p>
          {isRegenerating && job && (
            <div className="mt-5 space-y-2">
              <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                <div
                  className="bg-[#c9a84c] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${job.progress || 0}%` }}
                />
              </div>
              <p className="text-[12px] text-[#555]">{job.current_step?.replace(/_/g, " ") || "Queued"} — {job.progress || 0}%</p>
            </div>
          )}
          {carousel.status === "failed" && (
            <div className="mt-5 space-y-3">
              {job?.error && <p className="text-[13px] text-[#e84057]">{job.error}</p>}
              <button
                onClick={() => {
                  if (!carouselId) return;
                  regenerate.mutate(
                    { carouselId, lutId: carousel.lut_id },
                    {
                      onSuccess: () => toast.success("Regenerating carousel..."),
                      onError: () => toast.error("Failed to start regeneration"),
                    },
                  );
                }}
                disabled={regenerate.isPending}
                className="flex items-center gap-2 mx-auto bg-[#111] border border-[#222] rounded-xl px-5 py-2.5 text-[13px] font-medium text-[#888] hover:border-[#333] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                {regenerate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerate Carousel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const slide = carousel.slides[activeSlide];
  const confidence = carousel.confidence;
  const isStory = carousel.content_type === "story";
  const aspectClass = isStory ? "aspect-[9/16]" : "aspect-4/5";

  const confidenceItems = [
    { label: "Transcript Strength", value: confidence.transcript_strength },
    { label: "Hook Strength", value: confidence.hook_strength },
    { label: "Image-Copy Fit", value: confidence.image_copy_fit },
    { label: "Brand Fit", value: confidence.brand_fit },
    { label: "Style Fit", value: confidence.style_fit },
    { label: "Image Quality", value: confidence.image_quality_avg },
    { label: "CTA Fit", value: confidence.cta_fit },
    { label: "Save Potential", value: confidence.save_potential },
    { label: "DM Potential", value: confidence.dm_potential },
  ];

  async function downloadSlides() {
    if (!carousel) return;
    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      await Promise.all(
        carousel.slides.map(async (s) => {
          const key = s.rendered_key || s.image_key;
          if (!key) return;
          const resp = await fetch(`/uploads/${key}`);
          const blob = await resp.blob();
          zip.file(`slide-${s.position}.png`, blob);
        }),
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carousel-${carouselId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download slides");
    } finally {
      setDownloading(false);
    }
  }

  // Keyboard shortcuts for slide navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!carousel || carousel.status !== "ready") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setActiveSlide((prev) => Math.max(0, prev - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setActiveSlide((prev) => Math.min(carousel.slides.length - 1, prev + 1));
          break;
        case "Home":
          e.preventDefault();
          setActiveSlide(0);
          break;
        case "End":
          e.preventDefault();
          setActiveSlide(carousel.slides.length - 1);
          break;
        case "c":
          if (e.metaKey || e.ctrlKey) break;
          copyCaption();
          break;
        case "d":
          downloadSlides();
          break;
        case "m":
          setMobilePreview((prev) => !prev);
          break;
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [carousel, copyCaption]);

  return (
    <div>
      {/* Sticky Toolbar */}
      <div className="sticky top-14 z-40 -mx-6 px-6 py-3 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back + Title + Meta */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/clients/${clientId}/history`}
              className="text-[#555] hover:text-[#888] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-[18px] font-bold text-white tracking-tight flex-shrink-0">
              Your {isStory ? "Story" : "Carousel"}
            </h1>
            <ConfidenceBadge score={confidence.overall} />
            <span className="text-[#333]">|</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[#666] text-[12px]">{carousel.slides.length} {isStory ? "frames" : "slides"}</span>
              <span className="text-[#333]">&middot;</span>
              <span className="text-[#666] text-[12px] capitalize">{carousel.goal.replace(/_/g, " ")}</span>
              {carousel.slides.filter((s) => s.is_ai_generated_image).length > 0 && (
                <>
                  <span className="text-[#333]">&middot;</span>
                  <span className="text-[#c9a84c] text-[12px]">{carousel.slides.filter((s) => s.is_ai_generated_image).length} AI</span>
                </>
              )}
            </div>
            <span className="text-[#333]">|</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[#888] text-[12px] font-medium">v1</span>
              <span className="bg-[#161616] border border-[#222] text-[#555] text-[10px] px-1.5 py-0 rounded">Latest</span>
              <span className="text-[#444] text-[12px]">{new Date(carousel.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {carousel.caption && carousel.caption.replace(/\s*#\w+/g, "").trim() && (
              <button
                onClick={copyCaption}
                className="flex items-center gap-1.5 bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-[#888] text-[12px] font-medium hover:border-[#333] hover:text-white transition-all cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                {copied ? "Copied!" : "Caption"}
              </button>
            )}

            {!carousel.posted_to_ig && carouselId && (
              <button
                onClick={() => {
                  publishIg.mutate(carouselId, {
                    onSuccess: () => toast.success("Posted to Instagram!"),
                    onError: (err: Error) => toast.error(err.message || "Failed to post"),
                  });
                }}
                disabled={publishIg.isPending}
                className="flex items-center gap-1.5 bg-[#c9a84c] rounded-lg px-3 py-1.5 text-black text-[12px] font-bold hover:bg-[#d4b55a] transition-colors cursor-pointer disabled:opacity-50"
              >
                {publishIg.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Instagram className="w-3 h-3" />}
                {publishIg.isPending ? "Posting..." : "Publish"}
              </button>
            )}
            {carousel.posted_to_ig && (
              <span className="flex items-center gap-1 bg-[#161616] border border-[#222] text-[#888] text-[12px] px-3 py-1.5 rounded-lg">
                <Instagram className="w-3 h-3" /> Posted
              </span>
            )}

            <button
              onClick={downloadSlides}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-[#888] text-[12px] font-medium hover:border-[#333] hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Download
            </button>

            {previewLutId && carouselId && (
              <button
                onClick={() => {
                  applyLut.mutate(
                    { carouselId, lutId: previewLutId },
                    {
                      onSuccess: () => {
                        toast.success("LUT applied — slides re-rendered");
                        setPreviewLutId(undefined);
                      },
                      onError: () => toast.error("Failed to apply LUT"),
                    },
                  );
                }}
                disabled={applyLut.isPending}
                className="flex items-center gap-1.5 bg-[#c9a84c] rounded-lg px-3 py-1.5 text-black text-[12px] font-bold hover:bg-[#d4b55a] transition-colors cursor-pointer disabled:opacity-50"
              >
                {applyLut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Palette className="w-3 h-3" />}
                Apply LUT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-5 lg:grid-cols-[5fr_3fr] pt-4">
        {/* Slide Preview Area */}
        <div className="space-y-3">
          {/* Active Slide */}
          <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <span className="text-white text-[14px] font-semibold">
                  Slide {activeSlide + 1}
                </span>
                <span className="text-[#555] text-[12px]">—</span>
                <span className="text-[#888] text-[12px] capitalize">{slide?.role?.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Desktop / Mobile preview toggle */}
                <div className="flex items-center bg-[#0a0a0a] border border-[#222] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setMobilePreview(false)}
                    title="Desktop view"
                    className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-md transition-all cursor-pointer",
                      !mobilePreview ? "bg-[#222] text-white" : "text-[#555] hover:text-[#888]",
                    )}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobilePreview(true)}
                    title="Mobile preview"
                    className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-md transition-all cursor-pointer",
                      mobilePreview ? "bg-[#222] text-white" : "text-[#555] hover:text-[#888]",
                    )}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
                {carouselId && slide && (
                  <SlideCompositionSwitcher
                    carouselId={carouselId}
                    position={slide.position}
                    currentComposition={slide.composition}
                  />
                )}
                {slide?.is_ai_generated_image && (
                  <span className="bg-[#c9a84c]/10 text-[#c9a84c] text-[10px] font-semibold px-2 py-0.5 rounded-md">AI Image</span>
                )}
              </div>
            </div>
            <div className="flex justify-center p-3 max-h-[70vh] overflow-auto bg-[#0a0a0a]">
              {mobilePreview ? (
                /* Mobile phone frame */
                <div className="relative mx-auto" style={{ width: 390 }}>
                  {/* Phone bezel */}
                  <div className="rounded-[2.5rem] border-[3px] border-[#333] bg-black p-2 shadow-2xl shadow-black/60">
                    {/* Notch */}
                    <div className="mx-auto mb-2 h-6 w-28 rounded-full bg-[#1a1a1a]" />
                    {/* Screen */}
                    <div className="overflow-hidden rounded-[2rem] bg-black">
                      {/* Instagram-like header */}
                      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-black border-b border-[#222]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#8a7535]" />
                        <div>
                          <p className="text-white text-[13px] font-semibold leading-tight">username</p>
                          <p className="text-[#666] text-[10px] leading-tight">Sponsored</p>
                        </div>
                      </div>
                      {/* Slide image */}
                      <div className={isStory ? "aspect-[9/16]" : "aspect-4/5"}>
                        {(slide?.rendered_key || slide?.image_key) ? (
                          <img
                            src={`/uploads/${slide.rendered_key || slide.image_key}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-[#111] flex items-center justify-center">
                            <p className="text-[#444] text-[11px]">No image</p>
                          </div>
                        )}
                      </div>
                      {isStory ? (
                        <>
                          {/* Story progress bars */}
                          <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                            {carousel.slides.map((_, i) => (
                              <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/30">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    i < activeSlide ? "bg-white w-full" : i === activeSlide ? "bg-white w-full" : "w-0",
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                          {/* Story reply bar */}
                          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 border border-white/30 rounded-full px-4 py-1.5">
                                <span className="text-white/50 text-[13px]">Send message</span>
                              </div>
                              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Instagram-like action row */}
                          <div className="flex items-center gap-4 px-4 py-2.5 bg-black">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            <div className="flex-1" />
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                          </div>
                          {/* Dots indicator */}
                          <div className="flex justify-center gap-1.5 pb-3">
                            {carousel.slides.map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full transition-colors",
                                  i === activeSlide ? "bg-[#c9a84c]" : "bg-[#333]",
                                )}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Home indicator */}
                    <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-[#333]" />
                  </div>
                </div>
              ) : (
                /* Desktop view — capped at 500px */
                <div className={`w-full ${isStory ? "max-w-[340px]" : "max-w-[500px]"}`}>
                  {(slide?.rendered_key || slide?.image_key) ? (
                    <SlideTextEditor
                      imageSrc={`/uploads/${slide.image_key}`}
                      copy={slide?.copy || ""}
                      aspectRatio={isStory ? "9/16" : "4/5"}
                      onCopyChange={(newCopy) => {
                        if (!carouselId || !slide) return;
                        updateCopy.mutate(
                          { carouselId, position: slide.position, copy: newCopy },
                          {
                            onSuccess: () => toast.success("Slide copy updated"),
                            onError: () => toast.error("Failed to update slide copy"),
                          },
                        );
                      }}
                      overlaySettings={overlaySettings[activeSlide] ?? defaultTextOverlaySettings}
                      onOverlayChange={(settings) =>
                        setOverlaySettings((prev) => ({ ...prev, [activeSlide]: settings }))
                      }
                      lutPreview={
                        previewLutId && previewLutData ? (
                          <LutPreview
                            imageSrc={`/uploads/${slide.rendered_key || slide.image_key}`}
                            lutData={previewLutData}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : undefined
                      }
                    />
                  ) : (
                    <div className={`${aspectClass} rounded-xl bg-[#0a0a0a] flex items-center justify-center`}>
                      <p className="text-[#444] text-[13px]">No image rendered yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Slide Thumbnail Strip with Arrow Navigation */}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollThumbs("left")}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center text-[#555] hover:text-white hover:border-[#333] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={thumbStripRef}
              className="flex-1 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex gap-2 py-1">
                {carousel.slides.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSlide(i)}
                    title={`Slide ${i + 1}${s.role ? ` — ${s.role.replace(/_/g, " ")}` : ""}`}
                    className={cn(
                      "relative flex-shrink-0 w-16 rounded-lg border-2 bg-[#111] overflow-hidden transition-all cursor-pointer",
                      i === activeSlide ? "border-[#c9a84c]" : "border-transparent hover:border-[#333]",
                    )}
                    style={{ aspectRatio: isStory ? "9/16" : "4/5" }}
                  >
                    {(s.rendered_key || s.image_key) && (
                      <img src={`/uploads/${s.rendered_key || s.image_key}`} alt="" className="h-full w-full object-cover" />
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-1 pt-3">
                      <div className="flex items-center justify-between">
                        {s.role && (
                          <span className="text-[8px] text-white/70 capitalize truncate">{s.role.replace(/_/g, " ")}</span>
                        )}
                        <span className="text-white text-[10px] font-bold">{i + 1}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollThumbs("right")}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center text-[#555] hover:text-white hover:border-[#333] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback Input + Regenerate */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. move text left, make writing punchier, more context about..."
              className="flex-1 bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-[#444] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
            />
            <button
              onClick={() => {
                if (!carouselId) return;
                regenerate.mutate(
                  { carouselId, lutId: carousel.lut_id },
                  {
                    onSuccess: () => toast.success("Regenerating carousel..."),
                    onError: () => toast.error("Failed to start regeneration"),
                  },
                );
              }}
              disabled={regenerate.isPending}
              className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-xl px-5 py-3 text-[#888] text-[14px] font-medium hover:border-[#333] hover:text-white transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </button>
          </div>

          {/* Copywriting / Image Rationale */}
          {(slide?.copy_why || slide?.image_selection_reason) && (
            <div className="space-y-2 px-1">
              {slide?.copy_why && (
                <p className="text-[12px] text-[#555]">
                  <span className="font-medium text-[#888]">Copywriting technique:</span> {slide.copy_why}
                </p>
              )}
              {slide?.image_selection_reason && (
                <p className="text-[12px] text-[#555]">
                  <span className="font-medium text-[#888]">Why this image:</span> {slide.image_selection_reason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
          {/* Caption — most actionable, shown first */}
          {carousel.caption && carousel.caption.replace(/\s*#\w+/g, "").trim() && (() => {
            const captionBody = carousel.caption.replace(/\s*#\w+/g, "").trim();
            const hashtags = (carousel.caption.match(/#\w+/g) || []).join(" ");
            const paragraphs = captionBody.split("\n\n").filter(Boolean);
            return (
              <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-[14px] font-semibold">Caption</h3>
                  <button
                    onClick={copyCaption}
                    className="flex items-center gap-1 text-[12px] text-[#555] hover:text-white transition-colors cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="space-y-2 text-[13px] text-[#ccc] leading-relaxed">
                  {paragraphs.length > 1
                    ? paragraphs.map((p, i) => <p key={i} className="whitespace-pre-wrap">{p}</p>)
                    : <p className="whitespace-pre-wrap">{captionBody}</p>
                  }
                </div>
                {hashtags && (
                  <>
                    <div className="border-t border-[#1a1a1a] my-3" />
                    <p className="text-[12px] text-[#555] leading-relaxed">{hashtags}</p>
                  </>
                )}
              </div>
            );
          })()}

          {/* Confidence */}
          <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
            <h3 className="text-white text-[14px] font-semibold flex items-center gap-2 mb-4">
              Confidence <ConfidenceBadge score={confidence.overall} />
            </h3>
            <div className="space-y-3">
              {confidenceItems.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="text-[#888]">{item.label}</span>
                    <span className="font-medium text-white">{item.value ?? "—"}</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-1">
                    <div
                      className={cn(
                        "h-1 rounded-full transition-all",
                        item.value >= 70 ? "bg-emerald-500" : item.value >= 40 ? "bg-amber-500" : "bg-red-500",
                      )}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
              {confidence.explanation && (
                <>
                  <div className="border-t border-[#1a1a1a] my-3" />
                  <p className="text-[12px] text-[#555] leading-relaxed">{confidence.explanation}</p>
                </>
              )}
            </div>
          </div>

          {/* LUT Picker — Searchable Dropdown */}
          {luts.length > 0 && (
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
              <h3 className="text-white text-[14px] font-semibold flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-[#c9a84c]" /> Color LUT
              </h3>
              <div className="relative" ref={lutDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setLutSearchOpen(!lutSearchOpen);
                    setLutSearch("");
                  }}
                  className="w-full flex items-center justify-between bg-[#0a0a0a] border border-[#222] rounded-xl px-3.5 py-2.5 text-[13px] hover:border-[#333] transition-colors cursor-pointer"
                >
                  <span className={previewLutId ? "text-white" : "text-[#888]"}>
                    {previewLutId
                      ? luts.find((l: ClientLut) => l._id === previewLutId)?.name ?? "Original"
                      : "Original (no LUT)"}
                  </span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[#555]" />
                </button>

                {lutSearchOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-[#111] border border-[#222] rounded-xl overflow-hidden shadow-xl shadow-black/40">
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#1a1a1a]">
                      <Search className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />
                      <input
                        type="text"
                        value={lutSearch}
                        onChange={(e) => setLutSearch(e.target.value)}
                        placeholder="Search LUTs..."
                        autoFocus
                        className="flex-1 bg-transparent text-white text-[13px] placeholder:text-[#444] focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setLutSearchOpen(false);
                        }}
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {(!lutSearch || "original".includes(lutSearch.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewLutId(undefined);
                            setLutSearchOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3.5 py-2 text-[13px] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                        >
                          <span className={!previewLutId ? "text-white font-medium" : "text-[#888]"}>
                            Original (no LUT)
                          </span>
                          {!previewLutId && <Check className="w-3.5 h-3.5 text-[#c9a84c]" />}
                        </button>
                      )}
                      {luts
                        .filter((lut: ClientLut) =>
                          !lutSearch || lut.name.toLowerCase().includes(lutSearch.toLowerCase()),
                        )
                        .map((lut: ClientLut) => (
                          <button
                            key={lut._id}
                            type="button"
                            onClick={() => {
                              setPreviewLutId(previewLutId === lut._id ? undefined : lut._id);
                              setLutSearchOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2 text-[13px] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                          >
                            <span className={previewLutId === lut._id ? "text-white font-medium" : "text-[#888]"}>
                              {lut.name}
                            </span>
                            {previewLutId === lut._id && <Check className="w-3.5 h-3.5 text-[#c9a84c]" />}
                          </button>
                        ))}
                      {lutSearch &&
                        !("original".includes(lutSearch.toLowerCase())) &&
                        luts.filter((lut: ClientLut) => lut.name.toLowerCase().includes(lutSearch.toLowerCase())).length === 0 && (
                          <p className="px-3.5 py-3 text-[12px] text-[#555] text-center">No LUTs found</p>
                        )}
                    </div>
                  </div>
                )}
              </div>
              {previewLutId && (
                <p className="text-[10px] text-[#444] mt-2">
                  Previewing client-side. Click "Apply LUT" to bake into final PNGs.
                </p>
              )}
            </div>
          )}

          {/* Transcript Inspiration */}
          {carousel.angle?.chosen_angle && (
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
              <h3 className="text-white text-[14px] font-semibold mb-3">Transcript Inspiration</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1">Chosen Angle</p>
                  <p className="text-[13px] text-[#ccc]">{carousel.angle.chosen_angle}</p>
                </div>
                <span className="inline-block bg-[#161616] border border-[#222] text-[#888] text-[10px] px-2 py-0.5 rounded-md capitalize">
                  {carousel.angle.angle_type?.replace(/_/g, " ")}
                </span>
                {carousel.angle.why_this_angle && (
                  <div>
                    <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1">Why This Angle</p>
                    <p className="text-[12px] text-[#666]">{carousel.angle.why_this_angle}</p>
                  </div>
                )}
                {carousel.angle.supporting_excerpts?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1">From the Transcript</p>
                    <div className="space-y-1.5">
                      {carousel.angle.supporting_excerpts.map((excerpt, i) => (
                        <p key={i} className="text-[12px] italic text-[#666] border-l-2 border-[#c9a84c]/30 pl-2">"{excerpt}"</p>
                      ))}
                    </div>
                  </div>
                )}
                {carousel.angle.hook_options?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1">Hook Options</p>
                    <div className="space-y-1">
                      {carousel.angle.hook_options.map((hook, i) => (
                        <p key={i} className="text-[12px] text-[#666]">{i + 1}. {hook}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strategy */}
          {carousel.strategy_notes && (
            <div className="bg-[#111] border border-[#222] rounded-2xl p-5">
              <h3 className="text-white text-[14px] font-semibold mb-3">Copy Strategy</h3>
              <p className="text-[12px] text-[#666] leading-relaxed">{carousel.strategy_notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="bg-[#111] border border-[#222] rounded-2xl px-5 py-3">
            <p className="text-[12px] text-[#666]">
              <span className="capitalize text-[#888]">{carousel.goal.replace(/_/g, " ")}</span>
              {" · "}
              {carousel.slides.length} slides
              {carousel.slides.filter((s) => s.is_ai_generated_image).length > 0 && (
                <>{" · "}{carousel.slides.filter((s) => s.is_ai_generated_image).length} AI images</>
              )}
              {" · "}
              {new Date(carousel.created_at).toLocaleString()}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 px-1">
            <span className="text-[#555] text-[13px] font-medium">Rate</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 cursor-pointer"
                >
                  <Star
                    className={cn(
                      "w-5 h-5 transition-colors",
                      star <= (hoverRating || rating)
                        ? "text-[#c9a84c] fill-[#c9a84c]"
                        : "text-[#333]",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3">
            <p className="text-[10px] text-[#444] font-medium uppercase tracking-wider mb-2">Keyboard Shortcuts</p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[#555]">Prev slide</span>
                <kbd className="text-[10px] text-[#444] border border-[#222] rounded px-1 py-0.5 font-mono">&larr;</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#555]">Next slide</span>
                <kbd className="text-[10px] text-[#444] border border-[#222] rounded px-1 py-0.5 font-mono">&rarr;</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#555]">Copy caption</span>
                <kbd className="text-[10px] text-[#444] border border-[#222] rounded px-1 py-0.5 font-mono">C</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#555]">Download</span>
                <kbd className="text-[10px] text-[#444] border border-[#222] rounded px-1 py-0.5 font-mono">D</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#555]">Mobile view</span>
                <kbd className="text-[10px] text-[#444] border border-[#222] rounded px-1 py-0.5 font-mono">M</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
