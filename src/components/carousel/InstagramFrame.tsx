import { useState, useRef, useCallback } from "react";
import { Heart, MessageCircle, Send, Bookmark, ImageIcon, X, Loader2 } from "lucide-react";
import type { Carousel, Client, ClientImage } from "@/types";

interface InstagramFrameProps {
  carousel: Carousel;
  client: Client | null;
  availableImages?: ClientImage[];
  swappingSlide?: number | null;
  onSwapImage?: (position: number, imageId: string) => void;
}

export function InstagramFrame({ carousel, client, availableImages, swappingSlide, onSwapImage }: InstagramFrameProps) {
  const [showPicker, setShowPicker] = useState(false);
  const slides = carousel.slides || [];
  const [current, setCurrent] = useState(0);
  const dragRef = useRef({ startX: 0, dragging: false, startTranslate: 0 });
  const [translate, setTranslate] = useState(0);

  const slideWidth = 420;
  const total = slides.length;

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, total - 1));
    setCurrent(clamped);
    setTranslate(-clamped * slideWidth);
  }, [total]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, dragging: true, startTranslate: translate };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    setTranslate(dragRef.current.startTranslate + dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const dx = e.clientX - dragRef.current.startX;
    const threshold = slideWidth * 0.2;
    if (dx < -threshold) goTo(current + 1);
    else if (dx > threshold) goTo(current - 1);
    else goTo(current);
  };

  const handle = client?.ig_username
    ? `@${client.ig_username}`
    : `@${(client?.name || "brand").toLowerCase().replace(/\s+/g, "")}`;
  const displayName = client?.name || "Brand";
  const initial = displayName[0].toUpperCase();
  const profilePic = client?.ig_profile_picture_url;

  return (
    <div style={{ width: 420, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* IG Header */}
      <div className="ig-header-row flex items-center gap-3 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full bg-[#c9a84c] flex items-center justify-center text-white text-sm font-semibold overflow-hidden shrink-0">
          {profilePic ? (
            <img src={profilePic} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white leading-tight">{handle}</p>
          <p className="text-[11px] text-[#888] leading-tight">Sponsored</p>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.5" fill="#888" />
          <circle cx="12" cy="12" r="1.5" fill="#888" />
          <circle cx="12" cy="19" r="1.5" fill="#888" />
        </svg>
      </div>

      {/* Carousel viewport */}
      <div
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ width: slideWidth, height: slideWidth * 1.25 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(${translate}px)`,
            transition: dragRef.current.dragging ? "none" : "transform 0.3s ease",
            width: total * slideWidth,
          }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="shrink-0 relative group/slide" style={{ width: slideWidth, height: slideWidth * 1.25 }}>
              {slide.rendered_key ? (
                <img
                  src={slide.rendered_url}
                  alt={`Slide ${i + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-[#111] flex items-center justify-center">
                  <p className="text-[#555] text-sm">Slide {i + 1}</p>
                </div>
              )}
              {/* Swap image button — visible on hover when this is the current slide */}
              {onSwapImage && i === current && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPicker(true); }}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover/slide:opacity-100 transition-opacity cursor-pointer hover:bg-black/90 pointer-events-auto"
                >
                  {swappingSlide === slide.position ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3 w-3" />
                  )}
                  {slide.image_key ? "Swap Photo" : "Add Photo"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1 py-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all cursor-pointer ${
              i === current ? "w-[6px] h-[6px] bg-[#0095f6]" : "w-[6px] h-[6px] bg-[#555]"
            }`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="ig-actions-row flex items-center px-3 py-1">
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6 text-white cursor-pointer" />
          <MessageCircle className="w-6 h-6 text-white cursor-pointer" />
          <Send className="w-6 h-6 text-white cursor-pointer" />
        </div>
        <div className="flex-1" />
        <Bookmark className="w-6 h-6 text-white cursor-pointer" />
      </div>

      {/* Caption */}
      {carousel.caption && (
        <div className="ig-caption-row px-3 py-1.5">
          <p className="text-[13px] text-[#ccc] leading-[1.45]">
            <span className="font-semibold text-white">{handle}</span>{" "}
            {carousel.caption.slice(0, 120)}{carousel.caption.length > 120 ? "..." : ""}
          </p>
          {carousel.hashtags?.length > 0 && (
            <p className="text-[13px] text-[#0095f6] mt-0.5">
              {carousel.hashtags.slice(0, 5).map((h) => `#${h}`).join(" ")}
            </p>
          )}
        </div>
      )}

      {/* Timestamp */}
      <div className="ig-caption-row px-3 pb-3">
        <p className="text-[10px] text-[#555] uppercase tracking-wide">2 hours ago</p>
      </div>

      {/* Photo picker modal */}
      {showPicker && onSwapImage && availableImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPicker(false)}>
          <div className="bg-[#111] border border-[#222] rounded-2xl w-[480px] max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
              <p className="text-[14px] font-semibold text-white">
                Swap photo — Slide {slides[current]?.position}
              </p>
              <button onClick={() => setShowPicker(false)} className="text-[#555] hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[calc(70vh-52px)]">
              <div className="grid grid-cols-4 gap-2">
                {availableImages.map((img) => {
                  const isCurrentImage = slides[current]?.image_id === img._id;
                  return (
                    <button
                      key={img._id}
                      onClick={() => {
                        onSwapImage(slides[current].position, img._id);
                        setShowPicker(false);
                      }}
                      disabled={isCurrentImage}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isCurrentImage
                          ? "border-[#c9a84c] opacity-50"
                          : "border-transparent hover:border-[#c9a84c]"
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
              {availableImages.length === 0 && (
                <p className="text-[#555] text-[13px] text-center py-8">No images available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
