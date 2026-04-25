import type { ForecastHour } from "../services/open-meteo";
import type { User } from "../services/users";
import type { HeaderStatus } from "../templates/site-show";
import type { FlyableWindow } from "./flyability";
import {
  dateKeyInTimezone,
  formatHourLabel,
  type groupForecastByDay,
} from "./forecast-day";
import { degreesToCardinal, formatWindSpeed } from "./wind";

export const findHourAt = (
  hours: ForecastHour[],
  target: Date,
): ForecastHour | null => {
  const targetMs = target.getTime();
  for (const h of hours) {
    if (h.time.getTime() === targetMs) return h;
  }
  return null;
};

export const formatEndLabel = (end: Date, timezone: string): string => {
  const raw = formatHourLabel(end, timezone);
  return raw === "00:00" ? "midnight" : raw;
};

export const dayOffsetLabel = (
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

export const formatDurationUntil = (target: Date, now: Date): string => {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (hours < 24) return `${hours}h ${minutes}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
};

export const formatDurationApprox = (target: Date, now: Date): string => {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return "now";
  const hours = Math.round(ms / (60 * 60 * 1000));
  if (hours < 1) return "in under an hour";
  if (hours < 24) return `in about ${hours} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? "in about a day" : `in about ${days} days`;
};

export const formatWindAtHour = (
  hour: ForecastHour | null,
  unit: "kph" | "mph",
): string => {
  if (!hour) return "";
  const dir = degreesToCardinal(hour.windDirectionDegrees);
  const speed = formatWindSpeed(hour.windSpeedKph, unit);
  return `${dir} ${speed}`;
};

export const buildHeaderStatus = (args: {
  forecastOk: boolean;
  hasBounds: boolean;
  window: FlyableWindow | null;
  timezone: string | null;
  currentHour: ForecastHour | null;
  windowStartHour: ForecastHour | null;
  user: User | null;
  now?: Date;
}): HeaderStatus => {
  const now = args.now ?? new Date();
  const unit = args.user?.wind_speed_unit ?? "kph";
  if (!args.forecastOk || !args.timezone) {
    return {
      kind: "forecast-error",
      label: "Forecast unavailable",
      headline: "Try again shortly",
    };
  }
  if (!args.hasBounds) {
    return {
      kind: "no-bounds",
      label: "Set wind limits",
      headline: "in settings",
    };
  }
  if (!args.window) {
    return {
      kind: "off",
      label: "Not flyable",
      headline: "Next 3 days",
    };
  }
  if (args.window.inProgress) {
    const endLabel = formatEndLabel(args.window.end, args.timezone);
    const wind = formatWindAtHour(args.currentHour, unit);
    const headline = wind ? `Until ${endLabel} · ${wind}` : `Until ${endLabel}`;
    return {
      kind: "now",
      label: "Flyable now",
      headline,
      detail: `Window closes in ${formatDurationUntil(args.window.end, now)}`,
    };
  }
  const startLabel = formatHourLabel(args.window.start, args.timezone);
  const endLabel = formatEndLabel(args.window.end, args.timezone);
  const wind = formatWindAtHour(args.windowStartHour, unit);
  const range = `${startLabel} – ${endLabel}`;
  const headline = wind ? `${range} · ${wind}` : range;
  const day = dayOffsetLabel(
    args.window.dayOffset,
    args.window.start,
    args.timezone,
  );
  return {
    kind: "soon",
    label: `Flyable ${day}`,
    headline,
    detail: formatDurationApprox(args.window.start, now),
  };
};

export const findCurrentHour = (
  hours: ReturnType<typeof groupForecastByDay>[number]["hours"],
  timezone: string,
  now: Date = new Date(),
): (typeof hours)[number] | null => {
  if (hours.length === 0) return null;
  const nowKey = dateKeyInTimezone(now, timezone);
  const nowHour = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  const nowHourNum = Number.parseInt(nowHour, 10);
  for (const h of hours) {
    if (dateKeyInTimezone(h.time, timezone) !== nowKey) continue;
    const hourStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }).format(h.time);
    if (Number.parseInt(hourStr, 10) === nowHourNum) return h;
  }
  return hours[0];
};
