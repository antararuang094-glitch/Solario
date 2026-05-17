"use client";

import * as React from "react";

/**
 * Eased count-up animation hook. Animates from 0 to `target` using
 * easeOutCubic, respecting `prefers-reduced-motion`. Single source of
 * truth — used by both the calculator hero card and the proof-stats
 * section on the landing page.
 *
 *   const val = useCountUp(1234);          // 0 → 1234
 *   const v2  = useCountUp(4.8, 1500, 1);  // animate over 1.5s, 1 decimal
 */
export function useCountUp(
  target: number,
  duration = 1300,
  decimals = 0
): number {
  const [val, setVal] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setVal(0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVal(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = target * eased;
      setVal(
        decimals > 0 ? Number(v.toFixed(decimals)) : Math.round(v)
      );
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);

  return val;
}
