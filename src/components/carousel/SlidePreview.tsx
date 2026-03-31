import type { CarouselSlide } from "@/types";

interface SlidePreviewProps {
  slide: CarouselSlide;
  total: number;
  className?: string;
}

export function SlidePreview({ slide, total, className = "" }: SlidePreviewProps) {
  const hasRenderedImage = !!slide.rendered_key;

  // If the backend has rendered this slide, show the rendered PNG
  if (hasRenderedImage) {
    return (
      <div className={`relative aspect-[4/5] rounded-2xl overflow-hidden bg-black ${className}`}>
        <img
          src={slide.rendered_url}
          alt={`Slide ${slide.position}`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Fallback: show copy text on a dark card (pre-render / generating state)
  return (
    <div
      className={`relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#0a0a0a] flex flex-col justify-center p-8 ${className}`}
    >
      {/* Role badge */}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c9a84c] mb-4">
        {slide.role}
      </span>

      {/* Copy */}
      <p className="text-white text-[18px] font-semibold leading-snug">
        {slide.copy || "Generating..."}
      </p>

      {/* Composition badge */}
      <span className="absolute bottom-14 left-8 text-[10px] text-[#444] capitalize">
        {slide.composition.replace(/_/g, " ")}
      </span>

      {/* Slide counter */}
      <span className="absolute bottom-4 right-5 text-[11px] text-[#333] font-medium">
        {slide.position}/{total}
      </span>
    </div>
  );
}
