import { describe, expect, test } from "bun:test";
import type { ForecastHour } from "../services/open-meteo";
import type { Site } from "../services/sites";
import type { User } from "../services/users";
import {
  effectiveSpeedRange,
  findNextFlyableWindow,
  formatFlyableWindow,
  isFlyableHour,
} from "./flyability";

const baseUser: User = {
  id: "u1",
  email: "a@b",
  role: "user",
  wind_speed_unit: "kph",
  min_wind_speed_kph: 10,
  max_wind_speed_kph: 35,
  min_wind_gust_kph: null,
  max_wind_gust_kph: 40,
  created_at: new Date(),
};

const baseSite: Site = {
  id: "s1",
  user_id: "u1",
  name: "Mam Tor",
  latitude: 53.349,
  longitude: -1.809,
  wind_arcs: [[60, 100]],
  club_url: null,
  notes: null,
  min_wind_speed_kph: null,
  max_wind_speed_kph: null,
  min_wind_gust_kph: null,
  max_wind_gust_kph: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const hour = (overrides: Partial<ForecastHour> = {}): ForecastHour => ({
  time: new Date("2026-04-21T12:00:00Z"),
  temperatureC: 10,
  windSpeedKph: 20,
  windGustsKph: 30,
  windDirectionDegrees: 80,
  precipitationMm: 0,
  precipitationProbability: 0,
  cloudCoverPercent: 0,
  weatherCode: 0,
  ...overrides,
});

describe("effectiveSpeedRange", () => {
  test("falls back to user when site has no overrides", () => {
    expect(effectiveSpeedRange(baseSite, baseUser)).toEqual({
      minWindKph: 10,
      maxWindKph: 35,
      minGustKph: null,
      maxGustKph: 40,
    });
  });

  test("site override wins when set", () => {
    const site: Site = {
      ...baseSite,
      min_wind_speed_kph: 0,
      max_wind_speed_kph: 60,
      min_wind_gust_kph: 20,
      max_wind_gust_kph: 70,
    };
    expect(effectiveSpeedRange(site, baseUser)).toEqual({
      minWindKph: 0,
      maxWindKph: 60,
      minGustKph: 20,
      maxGustKph: 70,
    });
  });

  test("each bound falls back independently", () => {
    const site: Site = { ...baseSite, min_wind_speed_kph: 5 };
    expect(effectiveSpeedRange(site, baseUser)).toEqual({
      minWindKph: 5,
      maxWindKph: 35,
      minGustKph: null,
      maxGustKph: 40,
    });
  });
});

describe("isFlyableHour", () => {
  test("returns false when no bounds are set", () => {
    const user: User = {
      ...baseUser,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    };
    const range = effectiveSpeedRange(baseSite, user);
    expect(isFlyableHour(hour(), baseSite, range, "UTC")).toBe(false);
  });

  test("returns false when wind is outside arcs", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    expect(
      isFlyableHour(
        hour({ windDirectionDegrees: 200 }),
        baseSite,
        range,
        "UTC",
      ),
    ).toBe(false);
  });

  test("returns false when wind is below min", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    expect(
      isFlyableHour(hour({ windSpeedKph: 5 }), baseSite, range, "UTC"),
    ).toBe(false);
  });

  test("returns false when wind is above max", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    expect(
      isFlyableHour(hour({ windSpeedKph: 40 }), baseSite, range, "UTC"),
    ).toBe(false);
  });

  test("returns false when gusts exceed max", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    expect(
      isFlyableHour(hour({ windGustsKph: 50 }), baseSite, range, "UTC"),
    ).toBe(false);
  });

  test("returns false when gusts are below min gust bound", () => {
    const user: User = { ...baseUser, min_wind_gust_kph: 25 };
    const range = effectiveSpeedRange(baseSite, user);
    expect(
      isFlyableHour(hour({ windGustsKph: 20 }), baseSite, range, "UTC"),
    ).toBe(false);
  });

  test("returns true when arc + all speed/gust bounds pass", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    expect(isFlyableHour(hour(), baseSite, range, "UTC")).toBe(true);
  });

  test("only a min bound is enough — no upper gust check", () => {
    const user: User = {
      ...baseUser,
      max_wind_speed_kph: null,
      max_wind_gust_kph: null,
      min_wind_gust_kph: null,
    };
    const range = effectiveSpeedRange(baseSite, user);
    expect(
      isFlyableHour(hour({ windGustsKph: 999 }), baseSite, range, "UTC"),
    ).toBe(true);
  });

  test("returns false before 08:00 local even when wind matches", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    expect(
      isFlyableHour(
        hour({ time: new Date("2026-04-21T07:00:00Z") }),
        baseSite,
        range,
        "UTC",
      ),
    ).toBe(false);
  });

  test("returns false at 18:00 local — daylight window ends at 18:00", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    expect(
      isFlyableHour(
        hour({ time: new Date("2026-04-21T18:00:00Z") }),
        baseSite,
        range,
        "UTC",
      ),
    ).toBe(false);
  });

  test("returns true at 17:00 local — last flyable hour of the day", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    expect(
      isFlyableHour(
        hour({ time: new Date("2026-04-21T17:00:00Z") }),
        baseSite,
        range,
        "UTC",
      ),
    ).toBe(true);
  });

  test("daylight gate is evaluated in the provided timezone", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    // 05:00 UTC is 07:00 in Europe/Berlin (CEST, UTC+2) — still pre-dawn.
    expect(
      isFlyableHour(
        hour({ time: new Date("2026-04-21T05:00:00Z") }),
        baseSite,
        range,
        "Europe/Berlin",
      ),
    ).toBe(false);
    // 07:00 UTC is 09:00 in Europe/Berlin — inside the daylight window.
    expect(
      isFlyableHour(
        hour({ time: new Date("2026-04-21T07:00:00Z") }),
        baseSite,
        range,
        "Europe/Berlin",
      ),
    ).toBe(true);
  });
});

const makeHours = (
  startIso: string,
  specs: Array<Partial<ForecastHour>>,
): ForecastHour[] => {
  const startMs = new Date(startIso).getTime();
  return specs.map((spec, i) =>
    hour({ ...spec, time: new Date(startMs + i * 60 * 60 * 1000) }),
  );
};

describe("findNextFlyableWindow", () => {
  test("returns null when no bounds are set", () => {
    const user: User = {
      ...baseUser,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    };
    const range = effectiveSpeedRange(baseSite, user);
    const hours = makeHours("2026-04-21T10:00:00Z", [{}, {}, {}]);
    expect(
      findNextFlyableWindow(
        hours,
        baseSite,
        range,
        "UTC",
        new Date("2026-04-21T10:00:00Z"),
      ),
    ).toBeNull();
  });

  test("returns null when no hour is flyable", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    const hours = makeHours("2026-04-21T10:00:00Z", [
      { windDirectionDegrees: 200 },
      { windDirectionDegrees: 200 },
    ]);
    expect(
      findNextFlyableWindow(
        hours,
        baseSite,
        range,
        "UTC",
        new Date("2026-04-21T10:00:00Z"),
      ),
    ).toBeNull();
  });

  test("finds a contiguous future window and stops at first non-flyable hour", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    const hours = makeHours("2026-04-21T10:00:00Z", [
      { windDirectionDegrees: 200 }, // 10:00 not flyable
      {}, // 11:00 flyable
      {}, // 12:00 flyable
      {}, // 13:00 flyable
      { windDirectionDegrees: 200 }, // 14:00 not flyable — window closes
      {}, // 15:00 flyable — ignored (not returned)
    ]);
    const window = findNextFlyableWindow(
      hours,
      baseSite,
      range,
      "UTC",
      new Date("2026-04-21T09:30:00Z"),
    );
    expect(window).not.toBeNull();
    if (!window) return;
    expect(window.start.toISOString()).toBe("2026-04-21T11:00:00.000Z");
    expect(window.end.toISOString()).toBe("2026-04-21T14:00:00.000Z");
    expect(window.inProgress).toBe(false);
    expect(window.dayOffset).toBe(0);
  });

  test("marks inProgress when the window has already begun", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    const hours = makeHours("2026-04-21T10:00:00Z", [
      {}, // 10:00 flyable, already in progress
      {}, // 11:00 flyable
      { windDirectionDegrees: 200 }, // 12:00 not
    ]);
    const window = findNextFlyableWindow(
      hours,
      baseSite,
      range,
      "UTC",
      new Date("2026-04-21T10:30:00Z"),
    );
    expect(window).not.toBeNull();
    if (!window) return;
    expect(window.inProgress).toBe(true);
    expect(window.end.toISOString()).toBe("2026-04-21T12:00:00.000Z");
  });

  test("skips hours that already ended", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    const hours = makeHours("2026-04-21T10:00:00Z", [
      {}, // 10:00 flyable but ended
      {}, // 11:00 flyable but ended
      {}, // 12:00 flyable — this is the one
      { windDirectionDegrees: 200 }, // 13:00 not
    ]);
    const window = findNextFlyableWindow(
      hours,
      baseSite,
      range,
      "UTC",
      new Date("2026-04-21T12:00:00Z"),
    );
    expect(window).not.toBeNull();
    if (!window) return;
    expect(window.start.toISOString()).toBe("2026-04-21T12:00:00.000Z");
  });

  test("computes dayOffset for tomorrow", () => {
    const range = effectiveSpeedRange(baseSite, baseUser);
    const hours = makeHours("2026-04-21T10:00:00Z", [
      { windDirectionDegrees: 200 }, // 10:00 today
      ...Array.from({ length: 23 }, () => ({
        windDirectionDegrees: 200,
      })),
      {}, // 09:00 tomorrow → flyable
      {}, // 10:00 tomorrow → flyable
    ]);
    const window = findNextFlyableWindow(
      hours,
      baseSite,
      range,
      "UTC",
      new Date("2026-04-21T09:00:00Z"),
    );
    expect(window).not.toBeNull();
    if (!window) return;
    expect(window.dayOffset).toBe(1);
  });
});

describe("formatFlyableWindow", () => {
  test('"Flyable until HH:MM" when inProgress', () => {
    const label = formatFlyableWindow(
      {
        start: new Date("2026-04-21T09:00:00Z"),
        end: new Date("2026-04-21T12:00:00Z"),
        inProgress: true,
        dayOffset: 0,
      },
      "UTC",
    );
    expect(label).toBe("Flyable until 12:00");
  });

  test("today window uses HH:MM–HH:MM today", () => {
    const label = formatFlyableWindow(
      {
        start: new Date("2026-04-21T14:00:00Z"),
        end: new Date("2026-04-21T18:00:00Z"),
        inProgress: false,
        dayOffset: 0,
      },
      "UTC",
    );
    expect(label).toBe("Flyable 14:00–18:00 today");
  });

  test("tomorrow window uses tomorrow", () => {
    const label = formatFlyableWindow(
      {
        start: new Date("2026-04-22T09:00:00Z"),
        end: new Date("2026-04-22T11:00:00Z"),
        inProgress: false,
        dayOffset: 1,
      },
      "UTC",
    );
    expect(label).toBe("Flyable 09:00–11:00 tomorrow");
  });

  test("dayOffset >= 2 uses short weekday", () => {
    const label = formatFlyableWindow(
      {
        start: new Date("2026-04-23T08:00:00Z"),
        end: new Date("2026-04-23T12:00:00Z"),
        inProgress: false,
        dayOffset: 2,
      },
      "UTC",
    );
    expect(label).toBe("Flyable 08:00–12:00 Thu");
  });
});
