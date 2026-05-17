"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled,
  error,
}: OTPInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  const digits = React.useMemo(() => {
    return Array.from({ length }, (_, i) => value[i] ?? "");
  }, [value, length]);

  const setDigitAt = (idx: number, char: string) => {
    const next = digits.slice();
    next[idx] = char;
    onChange(next.join(""));
  };

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigitAt(idx, "");
      return;
    }
    if (raw.length > 1) {
      const arr = raw.slice(0, length - idx).split("");
      const next = digits.slice();
      arr.forEach((c, i) => {
        next[idx + i] = c;
      });
      onChange(next.join(""));
      const nextFocus = Math.min(idx + arr.length, length - 1);
      refs.current[nextFocus]?.focus();
      return;
    }
    setDigitAt(idx, raw);
    if (idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (text) {
      e.preventDefault();
      onChange(text);
      refs.current[Math.min(text.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} dari OTP`}
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "w-11 h-12 sm:w-12 sm:h-12 text-center text-lg font-semibold rounded-xl border bg-white text-ink",
            "focus:outline-none focus:ring-2 focus:ring-accent-deep/30 focus:border-accent-deep",
            "disabled:bg-surface disabled:cursor-not-allowed",
            error ? "border-red-500" : "border-border"
          )}
        />
      ))}
    </div>
  );
}
