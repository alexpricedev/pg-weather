import type { ForecastHour } from "../services/open-meteo";
import type { Site } from "../services/sites";
import type { User } from "../services/users";
import {
  dateKeyInTimezone,
  formatHourLabel,
  hourOfDayInTimezone,
} from "./forecast-day";
import { isDegreeInAnyArc } from "./wind";

export type SpeedRange = {
  minWindKph: number | null;
  maxWindKph: number | null;
  minGustKph: number | null;
  maxGustKph: number | null;
};

export const effectiveSpeedRange = (
  site: Site,
  user: User | null,
): SpeedRange => ({
  minWindKph: site.min_wind_speed_kph ?? user?.min_wind_speed_kph ?? null,
  maxWindKph: site.max_wind_speed_kph ?? user?.max_wind_speed_kph ?? null,
  minGustKph: site.min_wind_gust_kph ?? user?.min_wind_gust_kph ?? null,
  maxGustKph: site.max_wind_gust_kph ?? user?.max_wind_gust_kph ?? null,
});

export const hasAnyBound = (range: SpeedRange): boolean =>
  range.minWindKph !== null ||
  range.maxWindKph !== null ||
  range.minGustKph !== null ||
  range.maxGustKph !== null;

export const FLYABLE_START_HOUR = 8;
export const FLYABLE_END_HOUR = 18;

/**
 * An hour is flyable when it sits in the daylight window (08:00 ≤ local hour
 * < 18:00 — i.e. the 17:00 hour is the last flyable one, ending at 18:00),
 * wind direction sits in an accepted arc, AND every set bound is satisfied.
 * Null bounds are ignored. If no bounds are set at all, returns false so we
 * don't mark anything "go fly" without a preference.
 */
export const isFlyableHour = (
  hour: ForecastHour,
  site: Site,
  range: SpeedRange,
  timezone: string,
): boolean => {
  if (!hasAnyBound(range)) return false;
  const localHour = hourOfDayInTimezone(hour.time, timezone);
  if (localHour < FLYABLE_START_HOUR || localHour >= FLYABLE_END_HOUR)
    return false;
  if (!isDegreeInAnyArc(hour.windDirectionDegrees, site.wind_arcs))
    return false;
  if (range.minWindKph !== null && hour.windSpeedKph < range.minWindKph)
    return false;
  if (range.maxWindKph !== null && hour.windSpeedKph > range.maxWindKph)
    return false;
  if (range.minGustKph !== null && hour.windGustsKph < range.minGustKph)
    return false;
  if (range.maxGustKph !== null && hour.windGustsKph > range.maxGustKph)
    return false;
  return true;
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type FlyableWindow = {
  /** First flyable hour. */
  start: Date;
  /** One-past-the-last flyable hour (i.e. start of hour AFTER final flyable hour). */
  end: Date;
  /** True if the window has already begun relative to `now`. */
  inProgress: boolean;
  /** Day offset of `start` from `now` in the site timezone (0 = today). */
  dayOffset: number;
};

/**
 * Finds the first contiguous run of flyable hours from `now` onwards.
 * Returns null if no window exists in the provided hours (or no bounds set).
 */
export const findNextFlyableWindow = (
  hours: ForecastHour[],
  site: Site,
  range: SpeedRange,
  timezone: string,
  now: Date = new Date(),
): FlyableWindow | null => {
  if (!hasAnyBound(range)) return null;
  if (hours.length === 0) return null;

  const nowMs = now.getTime();
  let start: Date | null = null;
  let end: Date | null = null;

  for (const hour of hours) {
    const hourEndMs = hour.time.getTime() + ONE_HOUR_MS;
    if (hourEndMs <= nowMs) continue;

    if (isFlyableHour(hour, site, range, timezone)) {
      if (start === null) start = hour.time;
      end = new Date(hour.time.getTime() + ONE_HOUR_MS);
    } else if (start !== null) {
      break;
    }
  }

  if (!start || !end) return null;

  const todayKey = dateKeyInTimezone(now, timezone);
  const startKey = dateKeyInTimezone(start, timezone);
  let dayOffset = 0;
  if (startKey !== todayKey) {
    for (let i = 1; i <= 7; i++) {
      const probe = dateKeyInTimezone(
        new Date(now.getTime() + i * ONE_DAY_MS),
        timezone,
      );
      if (probe === startKey) {
        dayOffset = i;
        break;
      }
    }
  }

  return {
    start,
    end,
    inProgress: start.getTime() <= nowMs,
    dayOffset,
  };
};

const dayOffsetLabel = (
  offset: number,
  start: Date,
  timezone: string,
): string => {
  if (offset === 0) return "today";
  if (offset === 1) return "tomorrow";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
  }).format(start);
};

/**
 * Formats a flyable window as a short human-readable label, e.g.
 * "Flyable 14:00–18:00 today", "Flyable until 18:00", "Flyable 09:00–11:00 Thu".
 */
const endTimeLabel = (end: Date, timezone: string): string => {
  const raw = formatHourLabel(end, timezone);
  return raw === "00:00" ? "midnight" : raw;
};

export const formatFlyableWindow = (
  window: FlyableWindow,
  timezone: string,
): string => {
  const endLabel = endTimeLabel(window.end, timezone);
  if (window.inProgress) {
    return `Flyable until ${endLabel}`;
  }
  const startLabel = formatHourLabel(window.start, timezone);
  const day = dayOffsetLabel(window.dayOffset, window.start, timezone);
  return `Flyable ${startLabel}–${endLabel} ${day}`;
};
