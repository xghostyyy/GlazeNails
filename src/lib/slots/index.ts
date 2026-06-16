import { toZonedTime } from "date-fns-tz";
import { addHours } from "date-fns";
import { subtractIntervals, clampToDayBoundary } from "./intervals";
import { minutesOfDay, weekdayInTZ, startOfDayInTZ, minuteToDateInTZ } from "./tz";
import type { GetAvailableSlotsParams, Interval } from "./types";

const ACTIVE_STATUSES = new Set(["PENDING", "CONFIRMED"]);

/**
 * Pure function — no DB calls. Returns UTC Date[] for each available slot start.
 */
export function getAvailableSlots(params: GetAvailableSlotsParams): Date[] {
  const { workingHours, timeOffs, existingAppointments, settings, date, durationMin, now, timezone } = params;

  const wd = weekdayInTZ(date, timezone);
  const zonedDate = toZonedTime(date, timezone);
  const dayStartUTC = startOfDayInTZ(date, timezone);

  // ── Step 1: Working intervals for this weekday ──────────────────────────
  let freeIntervals: Interval[] = workingHours
    .filter((wh) => wh.weekday === wd)
    .map((wh) => ({ startMin: wh.startMin, endMin: wh.endMin }))
    .map(clampToDayBoundary)
    .filter((i): i is Interval => i !== null);

  if (freeIntervals.length === 0) return [];

  // ── Step 2: Subtract TimeOffs ────────────────────────────────────────────
  const timeOffIntervals: Interval[] = timeOffs
    .map((to) => {
      const start = minutesOfDay(to.startsAt, timezone);
      const end = minutesOfDay(to.endsAt, timezone);
      // If timeOff spans midnight or doesn't overlap this day, handle accordingly
      const toStartUTC = to.startsAt.getTime();
      const toEndUTC = to.endsAt.getTime();
      const dayEndUTC = dayStartUTC.getTime() + 24 * 60 * 60 * 1000;
      if (toEndUTC <= dayStartUTC.getTime() || toStartUTC >= dayEndUTC) return null;
      // Clamp to this day
      const clampedStart = Math.max(0, toStartUTC < dayStartUTC.getTime() ? 0 : start);
      const clampedEnd = Math.min(1440, toEndUTC > dayEndUTC ? 1440 : end);
      return clampedStart < clampedEnd ? { startMin: clampedStart, endMin: clampedEnd } : null;
    })
    .filter((i): i is Interval => i !== null);

  freeIntervals = subtractIntervals(freeIntervals, timeOffIntervals);

  // ── Step 3: Subtract existing appointments (with buffer) ────────────────
  const bookedIntervals: Interval[] = existingAppointments
    .filter((a) => ACTIVE_STATUSES.has(a.status))
    .map((a) => {
      const startMin = minutesOfDay(a.startsAt, timezone);
      const endMin = minutesOfDay(a.endsAt, timezone) + settings.bufferAfterMin;
      return { startMin, endMin };
    });

  freeIntervals = subtractIntervals(freeIntervals, bookedIntervals);

  // ── Step 4: Generate slots on global granularity grid ────────────────────
  // Grid aligns to day-start (e.g. 10:00, 10:30, 11:00...) not to interval start,
  // so clients always see "round" times.
  const slots: Date[] = [];
  const { slotGranularity } = settings;

  // Find earliest work start to anchor the global grid
  const earliestStart = Math.min(...workingHours.map((wh) => wh.startMin));
  const gridOrigin = earliestStart;

  // Build candidate slot starts on the global grid within 0-1440 range
  // Then keep only those fully within a free interval
  const maxPossibleStart = 1440 - durationMin;
  let t = gridOrigin;
  while (t <= maxPossibleStart) {
    const slotEnd = t + durationMin;
    const withinFree = freeIntervals.some(
      (iv) => t >= iv.startMin && slotEnd <= iv.endMin
    );
    if (withinFree) {
      slots.push(minuteToDateInTZ(zonedDate, t, timezone));
    }
    t += slotGranularity;
  }

  // ── Step 5: Filter by lead time and horizon ───────────────────────────────
  const minStart = addHours(now, settings.minLeadHours);
  const maxStart = addHours(now, settings.maxAdvanceDays * 24);

  return slots
    .filter((s) => s >= minStart && s <= maxStart)
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Checks if a specific slot [startsAt, startsAt + durationMin] is free
 * given existing appointments. Used inside booking transaction.
 */
export function isSlotFree(
  startsAt: Date,
  endsAt: Date,
  existingAppointments: Array<{ startsAt: Date; endsAt: Date; status: string }>,
  bufferAfterMin: number
): boolean {
  for (const a of existingAppointments) {
    if (!ACTIVE_STATUSES.has(a.status)) continue;
    const aEnd = new Date(a.endsAt.getTime() + bufferAfterMin * 60 * 1000);
    // Overlap check: [startsAt, endsAt) overlaps [a.startsAt, aEnd)?
    if (startsAt < aEnd && endsAt > a.startsAt) return false;
  }
  return true;
}

export { subtractIntervals } from "./intervals";
export type { GetAvailableSlotsParams, Interval, SlotSettings } from "./types";
