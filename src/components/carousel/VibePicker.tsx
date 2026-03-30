import { cn } from "@quddify/ui";
import { VIBES, type Vibe } from "@/lib/vibes";

interface VibePickerProps {
  selected: Vibe | null;
  onSelect: (vibe: Vibe) => void;
}

export function VibePicker({ selected, onSelect }: VibePickerProps) {
  return (
    <div>
      <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
        Choose a Vibe
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {VIBES.map((vibe) => {
          const isSelected = selected?.id === vibe.id;
          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => onSelect(vibe)}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-all cursor-pointer",
                isSelected
                  ? "border-[#c9a84c] bg-[#c9a84c]/5 shadow-[0_0_20px_rgba(201,168,76,0.1)]"
                  : "border-[#222] bg-[#0a0a0a] hover:border-[#333] hover:bg-[#111]",
              )}
            >
              <span className="text-2xl">{vibe.emoji}</span>
              <span
                className={cn(
                  "text-[13px] font-semibold leading-tight",
                  isSelected ? "text-white" : "text-[#ccc] group-hover:text-white",
                )}
              >
                {vibe.name}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  isSelected ? "text-[#c9a84c]/70" : "text-[#555]",
                )}
              >
                {vibe.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
