"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "block w-full h-12 px-4 text-base sm:text-[15px] rounded-xl border bg-white text-ink placeholder:text-subtext",
          "focus:outline-none focus:ring-2 focus:ring-accent-deep/30 focus:border-accent-deep",
          "disabled:bg-surface disabled:cursor-not-allowed",
          error ? "border-red-500" : "border-border",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "block w-full min-h-[96px] px-4 py-3 text-base sm:text-[15px] rounded-xl border bg-white text-ink placeholder:text-subtext",
        "focus:outline-none focus:ring-2 focus:ring-accent-deep/30 focus:border-accent-deep",
        error ? "border-red-500" : "border-border",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
