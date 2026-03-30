import { cn } from "@quddify/ui";
import { Check } from "lucide-react";

export interface WizardStep {
  id: string;
  label: string;
  description: string;
}

interface GenerationWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export function GenerationWizard({ steps, currentStep, onStepClick }: GenerationWizardProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, i) => {
        const isPast = i < currentStep;
        const isCurrent = i === currentStep;
        const isClickable = i <= currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(i)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2.5 transition-all",
                isClickable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all",
                  isPast && "bg-emerald-500 text-white",
                  isCurrent && "bg-[#c9a84c] text-black",
                  !isPast && !isCurrent && "bg-[#1a1a1a] border border-[#333] text-[#555]",
                )}
              >
                {isPast ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className="text-left hidden sm:block">
                <p
                  className={cn(
                    "text-[12px] font-medium leading-tight",
                    isCurrent ? "text-white" : isPast ? "text-emerald-400" : "text-[#555]",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-[#444] leading-tight">{step.description}</p>
              </div>
            </button>

            {i < steps.length - 1 && (
              <div className="flex-1 mx-3">
                <div
                  className={cn(
                    "h-px transition-colors",
                    isPast ? "bg-emerald-500/40" : "bg-[#222]",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
