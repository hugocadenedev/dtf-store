"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  variant?: "default" | "light";
}

export function StepIndicator({ currentStep, steps, variant = "default" }: StepIndicatorProps) {
  const isLight = variant === "light";
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${isLight ? "justify-center" : "mb-10"}`}>
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <motion.span
              initial={false}
              animate={{
                scale: i === currentStep ? 1.1 : 1,
                backgroundColor:
                  i < currentStep
                    ? isLight ? "rgba(255,255,255,0.9)" : "var(--accent)"
                    : i === currentStep
                    ? isLight ? "rgba(255,255,255,0.9)" : "var(--accent)"
                    : "transparent",
                borderColor:
                  i <= currentStep
                    ? isLight ? "rgba(255,255,255,0.9)" : "var(--accent)"
                    : isLight ? "rgba(255,255,255,0.3)" : "var(--border)",
                color:
                  i <= currentStep
                    ? isLight ? "var(--accent)" : "#ffffff"
                    : isLight ? "rgba(255,255,255,0.5)" : "var(--muted)",
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-semibold border-2 rounded-full shrink-0"
            >
              {i < currentStep ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check size={12} strokeWidth={3} className="sm:w-3.5 sm:h-3.5" />
                </motion.div>
              ) : (
                i + 1
              )}
            </motion.span>
            <span
              className={`text-[10px] sm:text-xs font-medium tracking-wide transition-colors duration-300 hidden xs:inline sm:inline ${
                isLight
                  ? i <= currentStep ? "text-white" : "text-white/50"
                  : i <= currentStep ? "text-foreground" : "text-muted"
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 sm:w-10 h-0.5 rounded-full overflow-hidden ${isLight ? "bg-white/20" : "bg-border"}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: i < currentStep ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`h-full rounded-full ${isLight ? "bg-white/80" : "bg-foreground"}`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
