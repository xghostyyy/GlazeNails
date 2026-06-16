import type { Interval } from "./types";

/**
 * Subtracts `toRemove` intervals from `base` intervals.
 * Returns the remaining free intervals, clipped and split as needed.
 */
export function subtractIntervals(base: Interval[], toRemove: Interval[]): Interval[] {
  let result: Interval[] = [...base];

  for (const rem of toRemove) {
    const next: Interval[] = [];
    for (const seg of result) {
      // No overlap
      if (rem.endMin <= seg.startMin || rem.startMin >= seg.endMin) {
        next.push(seg);
        continue;
      }
      // Left portion
      if (rem.startMin > seg.startMin) {
        next.push({ startMin: seg.startMin, endMin: rem.startMin });
      }
      // Right portion
      if (rem.endMin < seg.endMin) {
        next.push({ startMin: rem.endMin, endMin: seg.endMin });
      }
    }
    result = next;
  }

  return result;
}

/** Clamp interval: ensures endMin ≤ 1440 (no crossing midnight) */
export function clampToDayBoundary(interval: Interval): Interval | null {
  const start = Math.max(0, interval.startMin);
  const end = Math.min(1440, interval.endMin);
  return start < end ? { startMin: start, endMin: end } : null;
}
