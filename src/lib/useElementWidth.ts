"use client";

import { useEffect, useState, type RefObject } from "react";

/** Live content width of an element in px (0 until measured). */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/**
 * Largest seat size (up to `max`) at which `cols` seats plus bench gaps fit in `available` px.
 * Never smaller than `min`; the grid then scrolls sideways.
 */
export function fitCellSize(
  available: number,
  cols: number,
  seatsPerBench: number,
  max = 52,
  min = 32,
): number {
  if (available <= 0 || cols <= 0) return max;
  let gaps = 0;
  for (let c = 1; c < cols; c++) gaps += c % seatsPerBench === 0 ? 12 : 2;
  const fit = Math.floor((available - gaps) / cols);
  return Math.max(min, Math.min(max, fit));
}
