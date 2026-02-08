"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <nav aria-label="Progress" className="flex items-center gap-2">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-300",
                  isCompleted &&
                  "bg-blue-600 text-white shadow-sm shadow-blue-600/20",
                  isCurrent &&
                  "bg-blue-600 text-white shadow-md shadow-blue-600/25",
                  !isCompleted &&
                  !isCurrent &&
                  "bg-muted text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={cn(
                  "hidden text-xs sm:block",
                  isCurrent || isCompleted
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-0.5 h-0.5 w-5 rounded-full transition-colors duration-300 sm:w-8",
                  isCompleted ? "bg-blue-500" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
