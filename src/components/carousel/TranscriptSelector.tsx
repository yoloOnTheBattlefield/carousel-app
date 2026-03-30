import { useEffect } from "react";
import { Check, FileText } from "lucide-react";
import { useTranscripts } from "@/hooks/useTranscripts";
import { cn } from "@quddify/ui";

interface TranscriptSelectorProps {
  clientId: string | undefined;
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function TranscriptSelector({ clientId, selected, onChange }: TranscriptSelectorProps) {
  const { data: transcripts = [] } = useTranscripts(clientId);
  const ready = transcripts.filter((t) => t.status === "ready" || t.status === "pending");

  // Auto-select the most recent transcript if only one exists and nothing selected
  useEffect(() => {
    if (ready.length === 1 && selected.length === 0) {
      onChange([ready[0]._id]);
    }
  }, [ready.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id],
    );
  }

  if (ready.length === 0) {
    return (
      <div>
        <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
          Source Content
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#0a0a0a] p-4 text-[#444] text-[13px]">
          <FileText className="h-4 w-4 shrink-0" />
          No transcripts available. Add one first.
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
        Source Content
      </label>
      <div className="space-y-1.5">
        {ready.map((t) => {
          const isSelected = selected.includes(t._id);
          return (
            <button
              key={t._id}
              type="button"
              onClick={() => toggle(t._id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all cursor-pointer",
                isSelected
                  ? "border-[#c9a84c] bg-[#c9a84c]/5"
                  : "border-[#222] bg-[#0a0a0a] hover:border-[#333]",
              )}
            >
              <div className="min-w-0">
                <p className="text-white text-[14px] font-medium truncate">{t.title}</p>
                <p className="text-[#555] text-[11px] mt-0.5">
                  {t.call_type.replace(/_/g, " ")}
                  {t.overall_strength > 0 && ` · Strength ${t.overall_strength}`}
                </p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#c9a84c] flex items-center justify-center shrink-0 ml-3">
                  <Check className="h-3 w-3 text-black" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {ready.length > 1 && selected.length > 0 && (
        <p className="text-[#444] text-[10px] mt-2">
          {selected.length} transcript{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
