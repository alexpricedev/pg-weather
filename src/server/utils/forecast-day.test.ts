import { describe, expect, test } from "bun:test";
import { classifyHour, hourOfDayInTimezone } from "./forecast-day";

describe("hourOfDayInTimezone", () => {
  test("returns site-local hour regardless of UTC instant", () => {
    // 2026-04-21T00:30:00Z → 02:30 in Europe/Berlin (CEST, UTC+2)
    const d = new Date("2026-04-21T00:30:00Z");
    expect(hourOfDayInTimezone(d, "Europe/Berlin")).toBe(2);
    // same instant → 17:30 in America/Los_Angeles (PDT, UTC-7) on previous day
    expect(hourOfDayInTimezone(d, "America/Los_Angeles")).toBe(17);
  });

  test("midnight normalises to 0", () => {
    const d = new Date("2026-04-21T00:00:00Z");
    expect(hourOfDayInTimezone(d, "UTC")).toBe(0);
  });
});

describe("classifyHour", () => {
  test("hours before 08:00 are early", () => {
    expect(classifyHour(new Date("2026-04-21T00:00:00Z"), "UTC")).toBe("early");
    expect(classifyHour(new Date("2026-04-21T07:59:00Z"), "UTC")).toBe("early");
  });

  test("hours from 08:00 to 18:59 are day", () => {
    expect(classifyHour(new Date("2026-04-21T08:00:00Z"), "UTC")).toBe("day");
    expect(classifyHour(new Date("2026-04-21T12:00:00Z"), "UTC")).toBe("day");
    expect(classifyHour(new Date("2026-04-21T18:30:00Z"), "UTC")).toBe("day");
  });

  test("hours from 19:00 onwards are late", () => {
    expect(classifyHour(new Date("2026-04-21T19:00:00Z"), "UTC")).toBe("late");
    expect(classifyHour(new Date("2026-04-21T23:00:00Z"), "UTC")).toBe("late");
  });
});
