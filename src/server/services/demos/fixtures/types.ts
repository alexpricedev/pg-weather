import type { ForecastHour, SiteForecast } from "../../open-meteo";
import type { Site } from "../../sites";

export type DemoState = "now" | "soon" | "off";

export type DemoCardSummary = {
  state: DemoState;
  statusLabel: string;
  windNowSummary: string;
  primaryArcDegrees: number;
  primaryWindDegrees: number;
};

export type HourPattern = Omit<ForecastHour, "time">;

export type DemoFixture = {
  slug: string;
  site: Site;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  cardSummary: DemoCardSummary;
  pattern(localHour: number, dayOffset: number): HourPattern;
};

export const FIXED_DATE = new Date("2026-01-01T00:00:00Z");

export const buildSiteForecast = (
  fixture: DemoFixture,
  now: Date,
): SiteForecast => {
  const hours: ForecastHour[] = [];
  const anchor = startOfTodayLocalAsUtc(now, fixture.timezone);
  for (let i = 0; i < 72; i++) {
    const time = new Date(anchor.getTime() + i * 60 * 60 * 1000);
    const dayOffset = Math.floor(i / 24);
    const localHour = hourOfDayInTimezone(time, fixture.timezone);
    hours.push({ time, ...fixture.pattern(localHour, dayOffset) });
  }
  return {
    latitude: fixture.site.latitude,
    longitude: fixture.site.longitude,
    timezone: fixture.timezone,
    timezoneAbbreviation: fixture.timezoneAbbreviation,
    utcOffsetSeconds: fixture.utcOffsetSeconds,
    hours,
  };
};

const utcOffsetMinutes = (date: Date, timeZone: string): number => {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const localAsUtcMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((localAsUtcMs - date.getTime()) / 60000);
};

const startOfTodayLocalAsUtc = (now: Date, timeZone: string): Date => {
  const offsetMin = utcOffsetMinutes(now, timeZone);
  const localNow = new Date(now.getTime() + offsetMin * 60000);
  const midnightLocalAsLocalMs = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate(),
  );
  return new Date(midnightLocalAsLocalMs - offsetMin * 60000);
};

const hourOfDayInTimezone = (date: Date, timeZone: string): number => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  });
  return Number(formatter.format(date));
};
