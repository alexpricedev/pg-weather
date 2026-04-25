/**
 * Maps Open-Meteo WMO weather codes to a short label + meteocons icon slug.
 * Reference: https://open-meteo.com/en/docs (hourly weather_code values).
 * Icons: @meteocons/svg `monochrome` style — see WeatherIcon component.
 */

export type WeatherCodeInfo = {
  label: string;
  iconSlug: string;
};

const DEFAULT: WeatherCodeInfo = {
  label: "Unknown",
  iconSlug: "not-available",
};

const TABLE: Record<number, WeatherCodeInfo> = {
  0: { label: "Clear", iconSlug: "clear-day" },
  1: { label: "Mainly clear", iconSlug: "mostly-clear-day" },
  2: { label: "Partly cloudy", iconSlug: "partly-cloudy-day" },
  3: { label: "Overcast", iconSlug: "overcast-day" },
  45: { label: "Fog", iconSlug: "fog-day" },
  48: { label: "Rime fog", iconSlug: "fog-day" },
  51: { label: "Light drizzle", iconSlug: "drizzle" },
  53: { label: "Drizzle", iconSlug: "drizzle" },
  55: { label: "Heavy drizzle", iconSlug: "extreme-drizzle" },
  56: { label: "Freezing drizzle", iconSlug: "sleet" },
  57: { label: "Freezing drizzle", iconSlug: "sleet" },
  61: { label: "Light rain", iconSlug: "partly-cloudy-day-rain" },
  63: { label: "Rain", iconSlug: "rain" },
  65: { label: "Heavy rain", iconSlug: "extreme-rain" },
  66: { label: "Freezing rain", iconSlug: "sleet" },
  67: { label: "Freezing rain", iconSlug: "sleet" },
  71: { label: "Light snow", iconSlug: "partly-cloudy-day-snow" },
  73: { label: "Snow", iconSlug: "snow" },
  75: { label: "Heavy snow", iconSlug: "extreme-snow" },
  77: { label: "Snow grains", iconSlug: "snowflake" },
  80: { label: "Rain showers", iconSlug: "partly-cloudy-day-rain" },
  81: { label: "Rain showers", iconSlug: "rain" },
  82: { label: "Heavy showers", iconSlug: "thunderstorms-extreme-rain" },
  85: { label: "Snow showers", iconSlug: "partly-cloudy-day-snow" },
  86: { label: "Snow showers", iconSlug: "snow" },
  95: { label: "Thunderstorm", iconSlug: "thunderstorms" },
  96: { label: "Thunderstorm + hail", iconSlug: "thunderstorms-extreme-rain" },
  99: { label: "Thunderstorm + hail", iconSlug: "thunderstorms-extreme-rain" },
};

export const weatherCodeInfo = (code: number): WeatherCodeInfo => {
  return TABLE[code] ?? DEFAULT;
};
