import { Badge } from "@quddify/ui/badge";
import { cn } from "@quddify/ui";
import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  ready: {
    color: "bg-emerald-100 text-emerald-800",
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Complete",
  },
  completed: {
    color: "bg-emerald-100 text-emerald-800",
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Complete",
  },
  processing: {
    color: "bg-blue-100 text-blue-800",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    label: "Processing",
  },
  generating: {
    color: "bg-blue-100 text-blue-800",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    label: "Generating",
  },
  pending: {
    color: "bg-amber-100 text-amber-800",
    icon: <Clock className="h-3 w-3" />,
    label: "Pending",
  },
  queued: {
    color: "bg-amber-100 text-amber-800",
    icon: <Clock className="h-3 w-3" />,
    label: "Queued",
  },
  failed: {
    color: "bg-red-100 text-red-800",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Failed",
  },
  archived: {
    color: "bg-gray-100 text-gray-800",
    icon: null,
    label: "Archived",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", icon: null, label: status };

  return (
    <Badge variant="secondary" className={cn("inline-flex items-center gap-1 text-xs", config.color)}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
