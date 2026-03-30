import { useState } from "react";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";
import { LutUpload } from "@/components/carousel/LutUpload";
import { useLearningProfile } from "@/hooks/usePostInsights";
import { useSwipeFiles } from "@/hooks/useSwipeFiles";
import { cn } from "@quddify/ui";
import type { ClientLut } from "@/types";

export interface AdvancedOptionsState {
  copyModel: "claude-sonnet" | "claude-opus" | "gpt-4o";
  selectedLut: ClientLut | null;
  selectedSwipeFile: string | null;
  useLearnings: boolean;
  includeCaption: boolean;
}

interface AdvancedOptionsProps {
  clientId: string;
  options: AdvancedOptionsState;
  onChange: (options: AdvancedOptionsState) => void;
}

export const DEFAULT_ADVANCED_OPTIONS: AdvancedOptionsState = {
  copyModel: "claude-sonnet",
  selectedLut: null,
  selectedSwipeFile: null,
  useLearnings: true,
  includeCaption: true,
};

export function AdvancedOptions({ clientId, options, onChange }: AdvancedOptionsProps) {
  const [open, setOpen] = useState(false);
  const { data: learningProfile } = useLearningProfile(clientId);
  const { data: swipeFiles = [] } = useSwipeFiles(clientId);
  const readySwipeFiles = swipeFiles.filter((sf) => sf.status === "ready");
  const hasLearningProfile = learningProfile && learningProfile.posts_analyzed > 0;

  function update(patch: Partial<AdvancedOptionsState>) {
    onChange({ ...options, ...patch });
  }

  return (
    <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-[#111] transition-colors"
      >
        <span className="text-[#888] text-[13px] font-medium">Advanced Options</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[#555]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#555]" />
        )}
      </button>

      {open && (
        <div className="border-t border-[#1a1a1a] px-4 py-4 space-y-5">
          {/* AI Model */}
          <div>
            <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-2">
              AI Model
            </label>
            <div className="flex gap-2">
              {([
                { value: "claude-sonnet" as const, label: "Sonnet", hint: "Fast & great" },
                { value: "claude-opus" as const, label: "Opus", hint: "Best quality" },
                { value: "gpt-4o" as const, label: "GPT-4o", hint: "Alternative" },
              ]).map((model) => (
                <button
                  key={model.value}
                  type="button"
                  onClick={() => update({ copyModel: model.value })}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-[12px] font-medium transition-all cursor-pointer text-center",
                    options.copyModel === model.value
                      ? "bg-white text-black"
                      : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]",
                  )}
                >
                  <span className="block">{model.label}</span>
                  <span className={cn("text-[10px] font-normal", options.copyModel === model.value ? "text-black/60" : "text-[#555]")}>{model.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color LUT */}
          <div>
            <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-2">
              Color LUT
            </label>
            <LutUpload
              clientId={clientId}
              selectedLutId={options.selectedLut?._id}
              onSelect={(lut) => update({ selectedLut: lut })}
              compact
            />
          </div>

          {/* Reference Style */}
          {readySwipeFiles.length > 0 && (
            <div>
              <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-2">
                Reference Style
              </label>
              <div className="flex flex-wrap gap-1.5">
                {readySwipeFiles.map((sf) => (
                  <button
                    key={sf._id}
                    type="button"
                    onClick={() => update({ selectedSwipeFile: options.selectedSwipeFile === sf._id ? null : sf._id })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer",
                      options.selectedSwipeFile === sf._id
                        ? "border-[#c9a84c] bg-[#c9a84c]/5 border"
                        : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]",
                    )}
                  >
                    {sf.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Learning Profile */}
          {hasLearningProfile && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center shrink-0">
                  <Brain className="h-3.5 w-3.5 text-[#c9a84c]" />
                </div>
                <div>
                  <span className="text-[#ccc] text-[12px] font-medium block leading-tight">Post Insights</span>
                  <span className="text-[#555] text-[10px]">
                    From {learningProfile.posts_analyzed} analyzed post{learningProfile.posts_analyzed !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => update({ useLearnings: !options.useLearnings })}
                className={cn(
                  "relative w-10 h-5.5 rounded-full transition-colors cursor-pointer",
                  options.useLearnings ? "bg-[#c9a84c]" : "bg-[#222]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform",
                    options.useLearnings ? "translate-x-4.5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          )}

          {/* Include Caption */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[#ccc] text-[12px] font-medium block leading-tight">Include Caption</span>
              <span className="text-[#555] text-[10px]">Generate a post caption</span>
            </div>
            <button
              type="button"
              onClick={() => update({ includeCaption: !options.includeCaption })}
              className={cn(
                "relative w-10 h-5.5 rounded-full transition-colors cursor-pointer",
                options.includeCaption ? "bg-[#c9a84c]" : "bg-[#222]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform",
                  options.includeCaption ? "translate-x-4.5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
