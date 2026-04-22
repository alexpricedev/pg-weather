import { log } from "./logger";

export type ForecastHour = {
  time: Date;
  temperatureC: number;
  precipitationMm: number;
  precipitationProbability: number;
  cloudCoverPercent: number;
  weatherCode: number;
  windSpeedKph: number;
  windGustsKph: number;
  windDirectionDegrees: number;
};

export type SiteForecast = {
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  hours: ForecastHour[];
};

export type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    precipitation_probability: number[];
    cloud_cover: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    wind_direction_10m: number[];
  };
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const cache = new Map<string, { expiresAt: number; value: SiteForecast }>();

const cacheKey = (latitude: number, longitude: number): string => {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
};

export const clearForecastCache = (): void => {
  cache.clear();
};

export const parseOpenMeteoResponse = (
  raw: OpenMeteoResponse,
): SiteForecast => {
  const h = raw.hourly;
  const count = h.time.length;
  const hours: ForecastHour[] = [];
  for (let i = 0; i < count; i++) {
    hours.push({
      time: new Date(h.time[i]),
      temperatureC: h.temperature_2m[i],
      precipitationMm: h.precipitation[i],
      precipitationProbability: h.precipitation_probability[i],
      cloudCoverPercent: h.cloud_cover[i],
      weatherCode: h.weather_code[i],
      windSpeedKph: h.wind_speed_10m[i],
      windGustsKph: h.wind_gusts_10m[i],
      windDirectionDegrees: h.wind_direction_10m[i],
    });
  }
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone: raw.timezone,
    timezoneAbbreviation: raw.timezone_abbreviation,
    utcOffsetSeconds: raw.utc_offset_seconds,
    hours,
  };
};

export const buildForecastUrl = (
  latitude: number,
  longitude: number,
): string => {
  const url = new URL(ENDPOINT);
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "precipitation",
      "precipitation_probability",
      "cloud_cover",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
    ].join(","),
  );
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "3");
  return url.toString();
};

export const fetchForecast = async (
  latitude: number,
  longitude: number,
): Promise<SiteForecast> => {
  const key = cacheKey(latitude, longitude);
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now) {
    return entry.value;
  }

  const url = buildForecastUrl(latitude, longitude);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Open-Meteo request failed: ${response.status} ${response.statusText}`,
    );
  }

  const raw = (await response.json()) as OpenMeteoResponse;
  const parsed = parseOpenMeteoResponse(raw);
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, value: parsed });
  return parsed;
};

export type ForecastResult =
  | { ok: true; forecast: SiteForecast }
  | { ok: false; error: string };

export const safeFetchForecast = async (
  latitude: number,
  longitude: number,
): Promise<ForecastResult> => {
  try {
    const forecast = await fetchForecast(latitude, longitude);
    return { ok: true, forecast };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn("open-meteo", `Forecast fetch failed: ${message}`);
    return { ok: false, error: message };
  }
};
