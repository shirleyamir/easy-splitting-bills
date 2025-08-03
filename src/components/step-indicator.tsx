import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const StepIndicator = ({ steps, currentStep, className }: StepIndicatorProps) => {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {/* Step circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary bg-primary/10",
                  isUpcoming && "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-300",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
            
            {/* Step labels */}
            <div className="mt-2 text-center">
              <p
                className={cn(
                  "text-xs font-medium transition-colors duration-300",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};