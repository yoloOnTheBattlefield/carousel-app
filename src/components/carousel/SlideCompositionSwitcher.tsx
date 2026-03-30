import { CompositionIcon, COMPOSITION_OPTIONS } from "@/components/carousel/LayoutPresetPicker";
import { useRerenderSlide } from "@/hooks/useCarousels";
import type { SlideComposition } from "@/types";
import { cn } from "@quddify/ui";
import { Loader2 } from "lucide-react";

interface SlideCompositionSwitcherProps {
  carouselId: string;
  position: number;
  currentComposition: SlideComposition;
}

export function SlideCompositionSwitcher({ carouselId, position, currentComposition }: SlideCompositionSwitcherProps) {
  const rerenderSlide = useRerenderSlide();
  const isRerendering = rerenderSlide.isPending;

  function handleSwitch(composition: SlideComposition) {
    if (composition === currentComposition || isRerendering) return;
    rerenderSlide.mutate({ carouselId, position, composition });
  }

  return (
    <div className="flex items-center gap-1">
      {isRerendering && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mr-1" />}
      {COMPOSITION_OPTIONS.map((comp) => (
        <button
          key={comp.value}
          type="button"
          title={comp.label}
          disabled={isRerendering}
          onClick={() => handleSwitch(comp.value)}
          className={cn(
            "rounded p-1 transition-colors",
            currentComposition === comp.value
              ? "bg-primary/10 text-primary ring-1 ring-primary/30"
              : "hover:bg-muted text-muted-foreground",
            isRerendering && "opacity-50 cursor-not-allowed",
          )}
        >
          <CompositionIcon type={comp.value} size={24} />
        </button>
      ))}
    </div>
  );
}
