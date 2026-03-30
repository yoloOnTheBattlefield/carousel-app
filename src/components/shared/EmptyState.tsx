import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  steps?: Array<{
    label: string;
    description: string;
    completed?: boolean;
    href?: string;
  }>;
}

export function EmptyState({ icon, title, description, action, steps }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#222] bg-[#111]/50 py-16 px-6">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-[16px] font-semibold text-white">{title}</h3>
      {description && <p className="mt-1.5 text-[13px] text-[#555] text-center max-w-sm">{description}</p>}

      {steps && steps.length > 0 && (
        <div className="mt-6 w-full max-w-sm space-y-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                step.completed
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-[#222] bg-[#0a0a0a] hover:border-[#333]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                  step.completed
                    ? "bg-emerald-500 text-white"
                    : "bg-[#1a1a1a] border border-[#333] text-[#555]"
                }`}
              >
                {step.completed ? "✓" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium ${step.completed ? "text-emerald-400" : "text-white"}`}>
                  {step.label}
                </p>
                <p className="text-[11px] text-[#555]">{step.description}</p>
              </div>
              {step.href && !step.completed && (
                <Link
                  to={step.href}
                  className="flex items-center gap-1 text-[11px] text-[#c9a84c] hover:text-[#d4b55a] transition-colors flex-shrink-0"
                >
                  Go <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
