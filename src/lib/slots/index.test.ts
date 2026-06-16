import { describe, it, expect } from "vitest";
import { getAvailableSlots, subtractIntervals, isSlotFree } from "./index";
import type { GetAvailableSlotsParams } from "./types";

const TZ = "Europe/Amsterdam";

// Helper: build a Date for a specific hour:minute on a fixed date (Mon 2025-06-02, weekday=1)
function makeDate(h: number, m = 0): Date {
  // 2025-06-02 is a Monday
  return new Date(`2025-06-02T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+02:00`);
}

const BASE_SETTINGS = {
  slotGranularity: 30,
  bufferAfterMin: 15,
  minLeadHours: 0, // disable lead time for most tests
  maxAdvanceDays: 365,
};

const BASE_PARAMS: GetAvailableSlotsParams = {
  workingHours: [{ weekday: 1, startMin: 600, endMin: 1140 }], // Mon 10:00–19:00
  timeOffs: [],
  existingAppointments: [],
  settings: BASE_SETTINGS,
  date: new Date("2025-06-02T00:00:00+02:00"),
  durationMin: 60,
  now: new Date("2025-06-01T00:00:00+02:00"), // yesterday → no lead-time filtering
  timezone: TZ,
};

// ── 1. Basic: working hours produce expected slots ─────────────────────────
describe("getAvailableSlots", () => {
  it("returns slots within working hours (10:00–19:00, 60 min service, 30 min granularity)", () => {
    const slots = getAvailableSlots(BASE_PARAMS);
    // First slot at 10:00, last slot where 10:00+N*30 + 60 ≤ 19:00 → last start 18:00
    expect(slots.length).toBeGreaterThan(0);
    const hours = slots.map((s) => {
      const h = new Date(s).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
      return h;
    });
    expect(hours[0]).toBe("10:00");
    const lastHour = hours[hours.length - 1];
    expect(lastHour).toBe("18:00");
  });

  // ── 2. Shifts with break ─────────────────────────────────────────────────
  it("respects two work shifts with a midday break", () => {
    const slots = getAvailableSlots({
      ...BASE_PARAMS,
      workingHours: [
        { weekday: 1, startMin: 600, endMin: 780 },  // 10:00–13:00
        { weekday: 1, startMin: 840, endMin: 1140 }, // 14:00–19:00
      ],
    });
    const hours = slots.map((s) =>
      new Date(s).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    );
    // No slot starting at 13:00 (would end at 14:00, fits: but only if 13+60=14≤780? 780=13:00, so no)
    expect(hours).not.toContain("13:00");
    // 12:00 fits (12:00+60=13:00 = endMin 780 ✓)
    expect(hours).toContain("12:00");
    // First afternoon slot at 14:00
    expect(hours).toContain("14:00");
  });

  // ── 3. TimeOff removes slots ──────────────────────────────────────────────
  it("removes slots that overlap with a time-off", () => {
    const slots = getAvailableSlots({
      ...BASE_PARAMS,
      timeOffs: [
        {
          startsAt: makeDate(12, 0),
          endsAt: makeDate(14, 0),
        },
      ],
    });
    const hours = slots.map((s) =>
      new Date(s).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    );
    expect(hours).not.toContain("12:00");
    expect(hours).not.toContain("12:30");
    expect(hours).not.toContain("13:00");
    expect(hours).not.toContain("13:30");
    expect(hours).toContain("14:00");
  });

  // ── 4. Buffer between appointments ──────────────────────────────────────
  it("applies buffer after existing appointments", () => {
    const slots = getAvailableSlots({
      ...BASE_PARAMS,
      existingAppointments: [
        {
          startsAt: makeDate(10, 0),
          endsAt: makeDate(11, 0),    // 10:00–11:00 + 15 min buffer → blocked until 11:15
          status: "CONFIRMED",
        },
      ],
    });
    const hours = slots.map((s) =>
      new Date(s).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    );
    // 11:00 start: would overlap [10:00, 11:15) → not allowed
    expect(hours).not.toContain("11:00");
    // 11:30 start: [11:30, 12:30) does not overlap [10:00, 11:15) → OK
    expect(hours).toContain("11:30");
  });

  // ── 5. Lead time filtering ─────────────────────────────────────────────
  it("hides slots within minLeadHours from now", () => {
    // now = 10:30, minLeadHours = 2 → hide slots before 12:30
    const slots = getAvailableSlots({
      ...BASE_PARAMS,
      settings: { ...BASE_SETTINGS, minLeadHours: 2 },
      now: makeDate(10, 30),
    });
    const hours = slots.map((s) =>
      new Date(s).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    );
    expect(hours).not.toContain("10:00");
    expect(hours).not.toContain("11:00");
    expect(hours).not.toContain("12:00");
    // 12:30 ≥ 10:30 + 2h = 12:30 → allowed
    expect(hours).toContain("12:30");
  });

  // ── 6. No-work-day returns empty ─────────────────────────────────────────
  it("returns empty array on a day with no working hours", () => {
    const slots = getAvailableSlots({
      ...BASE_PARAMS,
      // date is Monday (weekday 1), but workingHours only for Sunday (0)
      workingHours: [{ weekday: 0, startMin: 600, endMin: 1140 }],
    });
    expect(slots).toHaveLength(0);
  });

  // ── 7. Fully booked day returns empty ────────────────────────────────────
  it("returns empty array when all slots are booked", () => {
    const slots = getAvailableSlots({
      ...BASE_PARAMS,
      existingAppointments: [
        {
          startsAt: makeDate(10, 0),
          endsAt: makeDate(19, 0), // covers entire working day
          status: "CONFIRMED",
        },
      ],
    });
    expect(slots).toHaveLength(0);
  });

  // ── 8. Midnight boundary: no cross-midnight slots ─────────────────────
  it("clamps working hours at midnight — no cross-midnight slots", () => {
    // Working hours 23:00–25:00 → should clamp to 23:00–24:00 (1380–1440)
    const slots = getAvailableSlots({
      ...BASE_PARAMS,
      workingHours: [{ weekday: 1, startMin: 1380, endMin: 1500 }], // 23:00–25:00
      durationMin: 60,
    });
    // Only 23:00 slot fits (23:00+60=24:00=1440, which is exactly boundary)
    const hours = slots.map((s) =>
      new Date(s).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    );
    expect(hours).toContain("23:00");
    // 23:30+60=24:30 → exceeds 1440 → not allowed
    expect(hours).not.toContain("23:30");
  });

  // ── 9. Rejected/Cancelled appointments don't block slots ─────────────
  it("ignores REJECTED/CANCELLED/COMPLETED appointments when calculating availability", () => {
    const slots = getAvailableSlots({
      ...BASE_PARAMS,
      existingAppointments: [
        { startsAt: makeDate(10, 0), endsAt: makeDate(11, 0), status: "REJECTED" },
        { startsAt: makeDate(11, 0), endsAt: makeDate(12, 0), status: "CANCELLED" },
        { startsAt: makeDate(12, 0), endsAt: makeDate(13, 0), status: "COMPLETED" },
      ],
    });
    const hours = slots.map((s) =>
      new Date(s).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    );
    expect(hours).toContain("10:00");
    expect(hours).toContain("11:00");
    expect(hours).toContain("12:00");
  });
});

// ── subtractIntervals unit tests ──────────────────────────────────────────
describe("subtractIntervals", () => {
  it("removes middle portion correctly", () => {
    const result = subtractIntervals(
      [{ startMin: 600, endMin: 1140 }],
      [{ startMin: 720, endMin: 840 }]
    );
    expect(result).toEqual([
      { startMin: 600, endMin: 720 },
      { startMin: 840, endMin: 1140 },
    ]);
  });

  it("handles non-overlapping removal", () => {
    const result = subtractIntervals(
      [{ startMin: 600, endMin: 900 }],
      [{ startMin: 1000, endMin: 1100 }]
    );
    expect(result).toEqual([{ startMin: 600, endMin: 900 }]);
  });

  it("fully removes when removal covers entire interval", () => {
    const result = subtractIntervals(
      [{ startMin: 600, endMin: 700 }],
      [{ startMin: 550, endMin: 750 }]
    );
    expect(result).toEqual([]);
  });
});

// ── isSlotFree tests ──────────────────────────────────────────────────────
describe("isSlotFree", () => {
  it("returns true when no appointments conflict", () => {
    expect(
      isSlotFree(makeDate(10), makeDate(11), [], 15)
    ).toBe(true);
  });

  it("returns false when appointment overlaps", () => {
    expect(
      isSlotFree(makeDate(10, 30), makeDate(11, 30), [
        { startsAt: makeDate(10), endsAt: makeDate(11), status: "CONFIRMED" },
      ], 15)
    ).toBe(false);
  });

  it("returns false when within buffer period", () => {
    // Existing: 10:00–11:00 + 15 min buffer → slot starting at 11:00 conflicts
    expect(
      isSlotFree(makeDate(11), makeDate(12), [
        { startsAt: makeDate(10), endsAt: makeDate(11), status: "CONFIRMED" },
      ], 15)
    ).toBe(false);
  });

  it("returns true for CANCELLED status", () => {
    expect(
      isSlotFree(makeDate(10), makeDate(11), [
        { startsAt: makeDate(10), endsAt: makeDate(11), status: "CANCELLED" },
      ], 15)
    ).toBe(true);
  });
});
