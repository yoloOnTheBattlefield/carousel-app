import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Loader2,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "@/lib/api";
import { useCarousel, useCarouselJob, useDeleteCarousel, useRegenerateCarousel } from "@/hooks/useCarousels";
import { useClient } from "@/hooks/useClients";
import { InstagramFrame } from "@/components/carousel/InstagramFrame";
import { ChatPanel } from "@/components/carousel/ChatPanel";

interface ToggleOption {
  key: string;
  label: string;
  enabled: boolean;
}

function ElementToggles({
  toggles,
  onChange,
}: {
  toggles: ToggleOption[];
  onChange: (key: string, enabled: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {toggles.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key, !t.enabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
            t.enabled
              ? "bg-white/10 text-white border border-[#333]"
              : "bg-[#111] text-[#555] border border-[#222] line-through"
          }`}
        >
          {t.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function CarouselEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Element visibility toggles
  const [toggleState, setToggleState] = useState<Record<string, boolean>>({
    progress_bar: true,
    swipe_arrow: true,
    tag_label: true,
    logo_lockup: true,
    cta_button: true,
    body_text: true,
    ig_header: true,
    ig_actions: true,
    ig_caption: true,
  });

  const toggles: ToggleOption[] = [
    { key: "progress_bar", label: "Progress Bar", enabled: toggleState.progress_bar },
    { key: "swipe_arrow", label: "Swipe Arrow", enabled: toggleState.swipe_arrow },
    { key: "tag_label", label: "Tag Labels", enabled: toggleState.tag_label },
    { key: "logo_lockup", label: "Logo", enabled: toggleState.logo_lockup },
    { key: "cta_button", label: "CTA Button", enabled: toggleState.cta_button },
    { key: "body_text", label: "Body Text", enabled: toggleState.body_text },
    { key: "ig_header", label: "IG Header", enabled: toggleState.ig_header },
    { key: "ig_actions", label: "IG Actions", enabled: toggleState.ig_actions },
    { key: "ig_caption", label: "IG Caption", enabled: toggleState.ig_caption },
  ];

  function handleToggle(key: string, enabled: boolean) {
    setToggleState((prev) => ({ ...prev, [key]: enabled }));
  }

  const { data: carousel, isLoading } = useCarousel(id);
  const { data: carouselClient } = useClient(carousel?.client_id);
  const { data: job } = useCarouselJob(
    carousel?.status === "queued" || carousel?.status === "generating" ? id : undefined
  );
  const deleteCarousel = useDeleteCarousel();
  const regenerate = useRegenerateCarousel();

  if (isLoading || !carousel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] animate-pulse" />
          <div className="h-8 w-48 bg-[#1a1a1a] rounded animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
          <div className="rounded-2xl bg-[#1a1a1a] animate-pulse" style={{ height: 700 }} />
          <div className="h-[600px] rounded-2xl bg-[#111] border border-[#222] animate-pulse" />
        </div>
      </div>
    );
  }

  const isProcessing = carousel.status === "queued" || carousel.status === "generating";
  const isFailed = carousel.status === "failed";
  const slides = carousel.slides || [];

  async function handleDownload() {
    const renderedSlides = slides.filter((s) => s.rendered_key);
    if (renderedSlides.length === 0) return;
    setDownloading(true);

    try {
      // Fetch all slide images as files
      const files = await Promise.all(
        renderedSlides.map(async (slide, i) => {
          const res = await api.get(`/carousels/${id}/slides/${slide.position}/download`, { responseType: "blob" });
          return new File([res.data], `slide-${i + 1}.png`, { type: "image/png" });
        })
      );

      // Mobile: use Web Share API to save to camera roll / share to IG
      if (navigator.canShare?.({ files })) {
        await navigator.share({
          files,
          title: carousel.topic || "Carousel slides",
        });
      } else {
        // Desktop fallback: zip download via server
        const token = localStorage.getItem("token");
        const accountId = localStorage.getItem("account_id");
        const params = new URLSearchParams();
        if (token) params.set("token", token);
        if (accountId) params.set("account_id", accountId);
        window.open(`/api/carousels/${id}/download?${params}`, "_blank");
      }
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    await deleteCarousel.mutateAsync(carousel._id);
    navigate("/");
  }

  const title = carousel.angle?.chosen_angle
    || slides[0]?.copy?.slice(0, 60)
    || "Carousel";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#222] text-[#555] hover:text-white hover:border-[#333] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-bold text-white tracking-tight truncate">{title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
              carousel.status === "ready" ? "bg-emerald-500/20 text-emerald-400"
              : carousel.status === "failed" ? "bg-[#e84057]/20 text-[#e84057]"
              : "bg-[#c9a84c]/20 text-[#c9a84c]"
            }`}>
              {carousel.status}
            </span>
            <span className="text-[#555] text-[12px]">{slides.length} slides</span>
            <span className="text-[#555] text-[12px] capitalize">{carousel.goal.replace(/_/g, " ")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isFailed && (
            <button
              onClick={() => regenerate.mutate(carousel._id)}
              disabled={regenerate.isPending}
              className="flex items-center gap-2 border border-[#222] text-[#888] font-medium px-4 py-2.5 rounded-xl text-[13px] hover:border-[#333] hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#222] text-[#555] hover:text-[#e84057] hover:border-[#e84057]/30 transition-all cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={isProcessing || downloading || slides.every((s) => !s.rendered_key)}
            className="flex items-center gap-2 bg-[#c9a84c] text-black font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#d4b55a] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? "Zipping..." : "Download All"}
          </button>
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="flex items-center gap-3 bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-xl px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-[#c9a84c]" />
          <div>
            <p className="text-[#c9a84c] text-[13px] font-medium">
              {job?.current_step ? `Step: ${job.current_step}` : "Generating your carousel..."}
            </p>
            <p className="text-[#c9a84c]/60 text-[12px]">
              AI is writing copy, selecting images, and rendering slides.
            </p>
          </div>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="flex items-center gap-3 bg-[#e84057]/5 border border-[#e84057]/20 rounded-xl px-4 py-3">
          <p className="text-[#e84057] text-[13px]">
            Generation failed. {carousel.generation_log?.slice(-1)[0] || "Try regenerating."}
          </p>
        </div>
      )}

      {/* Element toggles */}
      {slides.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-[#555] font-medium uppercase tracking-wider">Toggle Elements</span>
            <span className="text-[11px] text-[#444]">
              {toggles.filter((t) => t.enabled).length}/{toggles.length} visible
            </span>
          </div>
          <ElementToggles toggles={toggles} onChange={handleToggle} />
        </div>
      )}

      {/* Main layout: IG frame + chat */}
      {slides.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
          {/* Left: Instagram preview + details */}
          <div className="space-y-4">
            {/* IG Frame */}
            <div
              className="bg-black rounded-2xl overflow-hidden border border-[#222] mx-auto"
              style={{ width: 420 }}
            >
              {/* Conditionally hide IG chrome elements via CSS */}
              <style>{`
                ${!toggleState.ig_header ? ".ig-wrap .ig-header-row { display: none !important; }" : ""}
                ${!toggleState.ig_actions ? ".ig-wrap .ig-actions-row { display: none !important; }" : ""}
                ${!toggleState.ig_caption ? ".ig-wrap .ig-caption-row { display: none !important; }" : ""}
              `}</style>
              <div className="ig-wrap">
                <InstagramFrame carousel={carousel} client={carouselClient ?? null} />
              </div>
            </div>

            {/* Strategy notes */}
            {carousel.strategy_notes && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-4" style={{ maxWidth: 420, margin: "0 auto" }}>
                <span className="text-[12px] text-[#555] font-medium uppercase tracking-wider block mb-2">Strategy</span>
                <p className="text-[#888] text-[13px]">{carousel.strategy_notes}</p>
              </div>
            )}

            {/* Caption */}
            {carousel.caption && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-4" style={{ maxWidth: 420, margin: "0 auto" }}>
                <span className="text-[12px] text-[#555] font-medium uppercase tracking-wider block mb-2">Caption</span>
                <p className="text-[#ccc] text-[13px] whitespace-pre-wrap">{carousel.caption}</p>
                {carousel.hashtags?.length > 0 && (
                  <p className="text-[#c9a84c] text-[12px] mt-2">{carousel.hashtags.map((h) => `#${h}`).join(" ")}</p>
                )}
              </div>
            )}

            {/* Confidence */}
            {carousel.confidence?.overall > 0 && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-4" style={{ maxWidth: 420, margin: "0 auto" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-[#555] font-medium uppercase tracking-wider">Confidence</span>
                  <span className="text-[#c9a84c] text-[16px] font-bold">{carousel.confidence.overall}/10</span>
                </div>
                {carousel.confidence.explanation && (
                  <p className="text-[#888] text-[12px]">{carousel.confidence.explanation}</p>
                )}
              </div>
            )}
          </div>

          {/* Right: Chat panel */}
          <div className="lg:h-[calc(100vh-200px)] lg:sticky lg:top-20">
            <ChatPanel carouselId={carousel._id} />
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white text-[15px] font-semibold mb-2">Delete carousel?</h3>
            <p className="text-[#888] text-[13px] mb-4">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-[13px] text-[#888] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteCarousel.isPending}
                className="px-4 py-2 bg-[#e84057] text-white text-[13px] font-semibold rounded-xl hover:bg-[#ff5070] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteCarousel.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
