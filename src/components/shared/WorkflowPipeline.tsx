import { cn } from "@quddify/ui";
import { Clock, Sparkles, CheckCircle2, Send, Instagram, Archive } from "lucide-react";
import type { CarouselStatus } from "@/types";

const PIPELINE_STAGES: Array<{
  status: CarouselStatus;
  label: string;
  icon: React.ElementType;
}> = [
  { status: "queued", label: "Queued", icon: Clock },
  { status: "generating", label: "Generating", icon: Sparkles },
  { status: "ready", label: "Ready", icon: CheckCircle2 },
  { status: "scheduled", label: "Scheduled", icon: Send },
  { status: "published", label: "Published", icon: Instagram },
];

const STATUS_ORDER: Record<string, number> = {
  queued: 0,
  generating: 1,
  ready: 2,
  scheduled: 3,
  published: 4,
  failed: -1,
  archived: -2,
};

interface WorkflowPipelineProps {
  status: CarouselStatus;
  compact?: boolean;
}

export function WorkflowPipeline({ status, compact }: WorkflowPipelineProps) {
  const currentIndex = STATUS_ORDER[status] ?? -1;
  const isFailed = status === "failed";
  const isArchived = status === "archived";

  if (isFailed || isArchived) {
    const Icon = isFailed ? Clock : Archive;
    return (
      <div className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium",
        isFailed ? "bg-[#e84057]/10 text-[#e84057]" : "bg-[#333]/20 text-[#666]",
      )}>
        <Icon className="h-3.5 w-3.5" />
        {isFailed ? "Failed" : "Archived"}
      </div>
    );
  }

  if (compact) {
    const stage = PIPELINE_STAGES.find((s) => s.status === status) || PIPELINE_STAGES[0];
    const Icon = stage.icon;
    return (
      <div className="flex items-center gap-1.5 text-[12px]">
        <Icon className={cn(
          "h-3.5 w-3.5",
          currentIndex >= 2 ? "text-emerald-400" : "text-[#c9a84c]",
        )} />
        <span className={currentIndex >= 2 ? "text-emerald-400" : "text-[#888]"}>
          {stage.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STAGES.map((stage, i) => {
        const isPast = i < currentIndex;
        const isCurrent = i === currentIndex;
        const Icon = stage.icon;

        return (
          <div key={stage.status} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all",
                isCurrent && "bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30",
                isPast && "text-emerald-400",
                !isPast && !isCurrent && "text-[#333]",
              )}
              title={stage.label}
            >
              <Icon className="h-3 w-3" />
              {(isCurrent || isPast) && <span>{stage.label}</span>}
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div
                className={cn(
                  "w-4 h-px mx-0.5",
                  i < currentIndex ? "bg-emerald-400/40" : "bg-[#222]",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
