import { Badge } from "@quddify/ui/badge";
import { cn } from "@quddify/ui";

export function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-emerald-100 text-emerald-800"
      : score >= 50
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-800";

  return (
    <Badge variant="secondary" className={cn("text-xs font-semibold", color)}>
      {score}%
    </Badge>
  );
}
