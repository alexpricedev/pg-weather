import type { ForecastHour } from "../services/open-meteo";

export type ForecastDay = {
  key: string; // YYYY-MM-DD in the site's timezone
  label: string; // "Today", "Tomorrow", "Mon 21 Apr"
  hours: ForecastHour[];
};

/**
 * Produces a YYYY-MM-DD date key in the given IANA timezone.
 */
export const dateKeyInTimezone = (date: Date, timezone: string): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date in the site timezone as a short day label.
 */
const formatShortDayLabel = (date: Date, timezone: string): string => {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
};

/**
 * Formats an hour in the site timezone as HH:mm (24h).
 */
export const formatHourLabel = (date: Date, timezone: string): string => {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

/**
 * Returns the hour-of-day (0-23) for a date in the given IANA timezone.
 */
export const hourOfDayInTimezone = (date: Date, timezone: string): number => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  const parsed = Number.parseInt(hour, 10);
  return parsed === 24 ? 0 : parsed;
};

export type ForecastPeriod = "early" | "day" | "late";

/**
 * Classifies an hour into early (<08:00), day (08:00–18:00), or late (>18:00)
 * in the site's local timezone.
 */
export const classifyHour = (date: Date, timezone: string): ForecastPeriod => {
  const hour = hourOfDayInTimezone(date, timezone);
  if (hour < 8) return "early";
  if (hour > 18) return "late";
  return "day";
};

/**
 * Groups forecast hours into the 3 days (today / tomorrow / day after)
 * as resolved in the site's local timezone.
 */
export const groupForecastByDay = (
  hours: ForecastHour[],
  timezone: string,
  now: Date = new Date(),
): ForecastDay[] => {
  const grouped = new Map<string, ForecastHour[]>();
  for (const hour of hours) {
    const key = dateKeyInTimezone(hour.time, timezone);
    const list = grouped.get(key) ?? [];
    list.push(hour);
    grouped.set(key, list);
  }

  const todayKey = dateKeyInTimezone(now, timezone);
  const oneDay = 24 * 60 * 60 * 1000;
  const tomorrowKey = dateKeyInTimezone(
    new Date(now.getTime() + oneDay),
    timezone,
  );
  const dayAfterKey = dateKeyInTimezone(
    new Date(now.getTime() + 2 * oneDay),
    timezone,
  );

  const keys = [todayKey, tomorrowKey, dayAfterKey];
  const labels = ["Today", "Tomorrow", "Day after"];

  const days: ForecastDay[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const hoursForDay = grouped.get(key) ?? [];
    let label = labels[i];
    if (hoursForDay.length > 0) {
      label = `${labels[i]} — ${formatShortDayLabel(hoursForDay[0].time, timezone)}`;
    }
    days.push({ key, label, hours: hoursForDay });
  }
  return days;
};
