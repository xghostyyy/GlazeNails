import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfDay, getDay } from "date-fns";

/**
 * Returns the minute-of-day (0–1439) for `date` in the given timezone.
 */
export function minutesOfDay(date: Date, timezone: string): number {
  const zoned = toZonedTime(date, timezone);
  return zoned.getHours() * 60 + zoned.getMinutes();
}

/**
 * Returns the weekday (0=Sun … 6=Sat) for `date` in the given timezone.
 */
export function weekdayInTZ(date: Date, timezone: string): number {
  const zoned = toZonedTime(date, timezone);
  return getDay(zoned);
}

/**
 * Returns the start-of-day for `date` expressed in UTC,
 * using the given timezone to determine what "today" means.
 */
export function startOfDayInTZ(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  const dayStart = startOfDay(zoned);
  return fromZonedTime(dayStart, timezone);
}

/**
 * Converts a minute-of-day value to a UTC Date on the given calendar date (in TZ).
 */
export function minuteToDateInTZ(dateInTZ: Date, minuteOfDay: number, timezone: string): Date {
  const dayStartZoned = startOfDay(dateInTZ);
  dayStartZoned.setMinutes(minuteOfDay % 60);
  dayStartZoned.setHours(Math.floor(minuteOfDay / 60));
  dayStartZoned.setSeconds(0, 0);
  return fromZonedTime(dayStartZoned, timezone);
}
