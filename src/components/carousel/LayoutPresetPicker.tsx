import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import type { LayoutPreset, LayoutPresetMode, SlideComposition } from "@/types";
import { cn } from "@quddify/ui";

const COMPOSITION_OPTIONS: Array<{ value: SlideComposition; label: string; description: string }> = [
  { value: "single_hero", label: "Single Image", description: "One full-bleed portrait image with text overlay" },
  { value: "split_collage", label: "Split Collage", description: "Main image + 2-3 stacked inset photos" },
  { value: "grid_2x2", label: "2x2 Grid", description: "Four equal quadrant images" },
  { value: "before_after", label: "Before / After", description: "Two images split side by side" },
  { value: "lifestyle_grid", label: "Lifestyle Grid", description: "4-photo grid showing success markers" },
  { value: "text_only", label: "Text Only", description: "Bold text on gradient background" },
];

const MODE_OPTIONS: Array<{ value: LayoutPresetMode; label: string; description: string }> = [
  { value: "ai_suggested", label: "AI Suggested", description: "AI picks the best layout per slide" },
  { value: "uniform", label: "Uniform", description: "Same layout for all slides" },
  { value: "sequence", label: "Custom Sequence", description: "Pick layout per slide position" },
];

// Simple SVG icons for each composition type
function CompositionIcon({ type, size = 32 }: { type: SlideComposition; size?: number }) {
  const s = size;
  const p = 2; // padding
  const w = s - p * 2;
  const h = s - p * 2;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="text-muted-foreground">
      {type === "single_hero" && (
        <rect x={p} y={p} width={w} height={h} rx={2} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
      )}
      {type === "split_collage" && (
        <>
          <rect x={p} y={p} width={w * 0.6} height={h} rx={2} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
          <rect x={p + w * 0.65} y={p} width={w * 0.35} height={h * 0.48} rx={1} fill="currentColor" opacity={0.5} stroke="currentColor" strokeWidth={1} />
          <rect x={p + w * 0.65} y={p + h * 0.52} width={w * 0.35} height={h * 0.48} rx={1} fill="currentColor" opacity={0.5} stroke="currentColor" strokeWidth={1} />
        </>
      )}
      {type === "grid_2x2" && (
        <>
          <rect x={p} y={p} width={w * 0.48} height={h * 0.48} rx={1} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
          <rect x={p + w * 0.52} y={p} width={w * 0.48} height={h * 0.48} rx={1} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
          <rect x={p} y={p + h * 0.52} width={w * 0.48} height={h * 0.48} rx={1} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
          <rect x={p + w * 0.52} y={p + h * 0.52} width={w * 0.48} height={h * 0.48} rx={1} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
        </>
      )}
      {type === "before_after" && (
        <>
          <rect x={p} y={p} width={w * 0.48} height={h} rx={2} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
          <rect x={p + w * 0.52} y={p} width={w * 0.48} height={h} rx={2} fill="currentColor" opacity={0.5} stroke="currentColor" strokeWidth={1} />
        </>
      )}
      {type === "lifestyle_grid" && (
        <>
          <rect x={p} y={p} width={w * 0.48} height={h * 0.48} rx={1} fill="currentColor" opacity={0.4} stroke="currentColor" strokeWidth={1} />
          <rect x={p + w * 0.52} y={p} width={w * 0.48} height={h * 0.48} rx={1} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
          <rect x={p} y={p + h * 0.52} width={w * 0.48} height={h * 0.48} rx={1} fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1} />
          <rect x={p + w * 0.52} y={p + h * 0.52} width={w * 0.48} height={h * 0.48} rx={1} fill="currentColor" opacity={0.4} stroke="currentColor" strokeWidth={1} />
        </>
      )}
      {type === "text_only" && (
        <>
          <rect x={p} y={p} width={w} height={h} rx={2} fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={1} />
          <line x1={p + 6} y1={s * 0.35} x2={s - p - 6} y2={s * 0.35} stroke="currentColor" strokeWidth={2} opacity={0.5} />
          <line x1={p + 6} y1={s * 0.5} x2={s - p - 10} y2={s * 0.5} stroke="currentColor" strokeWidth={2} opacity={0.4} />
          <line x1={p + 6} y1={s * 0.65} x2={s - p - 14} y2={s * 0.65} stroke="currentColor" strokeWidth={2} opacity={0.3} />
        </>
      )}
    </svg>
  );
}

interface LayoutPresetPickerProps {
  value: LayoutPreset;
  onChange: (preset: LayoutPreset) => void;
  slideCount?: number;
}

export function LayoutPresetPicker({ value, onChange, slideCount = 7 }: LayoutPresetPickerProps) {
  const mode = value.mode;

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex flex-wrap gap-2">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (opt.value === "ai_suggested") {
                onChange({ mode: "ai_suggested" });
              } else if (opt.value === "uniform") {
                onChange({ mode: "uniform", default_composition: value.default_composition || "single_hero" });
              } else {
                onChange({
                  mode: "sequence",
                  sequence: value.sequence?.length
                    ? value.sequence
                    : Array.from({ length: slideCount }, (_, i) => ({
                        position: i + 1,
                        composition: "single_hero" as SlideComposition,
                      })),
                });
              }
            }}
            className={cn(
              "rounded-md border px-3 py-2 text-sm transition-colors",
              mode === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted",
            )}
          >
            <p className="font-medium">{opt.label}</p>
            <p className="text-[10px] text-muted-foreground">{opt.description}</p>
          </button>
        ))}
      </div>

      {/* Uniform: pick one composition for all slides */}
      {mode === "uniform" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COMPOSITION_OPTIONS.map((comp) => (
            <button
              key={comp.value}
              type="button"
              onClick={() => onChange({ ...value, default_composition: comp.value })}
              className={cn(
                "flex items-center gap-3 rounded-md border p-3 text-left transition-colors",
                value.default_composition === comp.value ? "border-primary bg-primary/5" : "hover:bg-muted",
              )}
            >
              <CompositionIcon type={comp.value} size={36} />
              <div>
                <p className="text-xs font-medium">{comp.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{comp.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Sequence: per-slide composition picker */}
      {mode === "sequence" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Set the layout for each slide position:</p>
          <div className="flex flex-wrap gap-2">
            {(value.sequence || []).map((item, idx) => (
              <div key={item.position} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Slide {item.position}</span>
                <div className="flex items-center gap-1">
                  <CompositionIcon type={item.composition} size={24} />
                  <Select
                    value={item.composition}
                    onValueChange={(v) => {
                      const newSeq = [...(value.sequence || [])];
                      newSeq[idx] = { ...item, composition: v as SlideComposition };
                      onChange({ ...value, sequence: newSeq });
                    }}
                  >
                    <SelectTrigger className="h-7 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPOSITION_OPTIONS.map((comp) => (
                        <SelectItem key={comp.value} value={comp.value} className="text-xs">
                          {comp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                const seq = value.sequence || [];
                onChange({
                  ...value,
                  sequence: [...seq, { position: seq.length + 1, composition: "single_hero" }],
                });
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              + Add slide
            </button>
            {(value.sequence?.length || 0) > 1 && (
              <button
                type="button"
                onClick={() => {
                  const seq = [...(value.sequence || [])];
                  seq.pop();
                  onChange({ ...value, sequence: seq });
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                - Remove last
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { CompositionIcon, COMPOSITION_OPTIONS };
