import { Link } from "react-router-dom";
import { Plus, Clock, ChevronRight, LayoutDashboard, Instagram } from "lucide-react";
import { useCarousels } from "@/hooks/useCarousels";
import { useSelectedClient } from "@/contexts/ClientContext";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Carousel } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  queued: "bg-[#c9a84c]/20 text-[#c9a84c]",
  generating: "bg-[#c9a84c]/20 text-[#c9a84c]",
  ready: "bg-emerald-500/20 text-emerald-400",
  failed: "bg-[#e84057]/20 text-[#e84057]",
};

function CarouselCard({ carousel }: { carousel: Carousel }) {
  const statusClass = STATUS_COLORS[carousel.status] || STATUS_COLORS.ready;
  const slides = carousel.slides || [];
  const title = carousel.angle?.chosen_angle || slides[0]?.copy?.slice(0, 60) || "Carousel";

  return (
    <Link
      to={`/carousels/${carousel._id}`}
      className="group block rounded-2xl border border-[#222] bg-[#111] hover:border-[#333] transition-all"
    >
      {/* Slide preview strip */}
      <div className="flex gap-1 p-3 pb-0 overflow-hidden">
        {slides.slice(0, 4).map((slide, i) => (
          <div
            key={i}
            className="flex-1 rounded-lg aspect-[4/5] overflow-hidden bg-[#1a1a1a]"
          >
            {slide.rendered_key ? (
              <img
                src={slide.rendered_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-1">
                <p className="text-[7px] font-semibold leading-tight text-center line-clamp-3 text-[#555]">
                  {slide.copy?.slice(0, 40) || slide.role}
                </p>
              </div>
            )}
          </div>
        ))}
        {slides.length > 4 && (
          <div className="flex-1 rounded-lg aspect-[4/5] bg-[#1a1a1a] flex items-center justify-center">
            <span className="text-[11px] text-[#555]">+{slides.length - 4}</span>
          </div>
        )}
        {slides.length === 0 && (
          <div className="flex-1 rounded-lg aspect-[4/5] bg-[#1a1a1a] flex items-center justify-center">
            <span className="text-[11px] text-[#444]">No slides yet</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-white text-[14px] font-semibold truncate">{title}</h3>
            <p className="text-[#555] text-[12px] mt-0.5 truncate capitalize">
              {carousel.goal.replace(/_/g, " ")}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-[#333] group-hover:text-[#555] transition-colors shrink-0 mt-0.5" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusClass}`}>
            {carousel.status}
          </span>
          <span className="text-[11px] text-[#444] flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(carousel.created_at).toLocaleDateString()}
          </span>
          <span className="text-[11px] text-[#444] ml-auto">
            {slides.length} slides
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { selectedClientId } = useSelectedClient();
  const { data: carousels, isLoading } = useCarousels(selectedClientId ?? undefined);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-[#1a1a1a] animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#222] bg-[#111] h-56 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Carousels</h1>
          <p className="text-[#555] text-[14px] mt-1">
            {carousels?.length
              ? `${carousels.length} carousel${carousels.length !== 1 ? "s" : ""}`
              : "Create your first carousel in 60 seconds"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/outreach"
            className="flex items-center gap-2 bg-[#111] border border-[#222] text-white font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:border-[#333] transition-colors"
          >
            <Instagram className="h-4 w-4" />
            Outreach
          </Link>
          <Link
            to="/create"
            className="flex items-center gap-2 bg-[#c9a84c] text-black font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#d4b55a] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Carousel
          </Link>
        </div>
      </div>

      {/* Grid */}
      {!carousels?.length ? (
        <EmptyState
          icon={<LayoutDashboard className="h-10 w-10 text-[#333]" />}
          title="No carousels yet"
          description="Select a client, pick transcripts, and let AI generate your carousel."
          action={
            <Link
              to="/create"
              className="flex items-center gap-2 bg-[#c9a84c] text-black font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#d4b55a] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Carousel
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {carousels.map((c) => (
            <CarouselCard key={c._id} carousel={c} />
          ))}
        </div>
      )}
    </div>
  );
}
