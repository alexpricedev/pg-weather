import { type DemoFixture, FIXED_DATE, type HourPattern } from "./types";

const TIMEZONE = "Europe/Paris";

export const forclazAnnecy: DemoFixture = {
  slug: "forclaz-annecy",
  timezone: TIMEZONE,
  timezoneAbbreviation: "CET",
  utcOffsetSeconds: 3600,
  site: {
    id: "demo-forclaz-annecy",
    user_id: "demo",
    name: "Forclaz · Annecy",
    latitude: 45.812,
    longitude: 6.252,
    wind_arcs: [[200, 260]],
    club_url: null,
    notes:
      "South-southwest launch above Lake Annecy. Best on warm afternoons with anabatic flow up the slope. Sample data only.",
    min_wind_speed_kph: 12,
    max_wind_speed_kph: 25,
    min_wind_gust_kph: null,
    max_wind_gust_kph: 30,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  },
  cardSummary: {
    state: "now",
    statusLabel: "Flyable now",
    windNowSummary: "WIND 16 KPH · SSW · IN ARC",
    primaryArcDegrees: 230,
    primaryWindDegrees: 220,
  },
  pattern(localHour, dayOffset) {
    return forclazPattern(localHour, dayOffset);
  },
};

const forclazPattern = (h: number, day: number): HourPattern => {
  const dirOffset = Math.sin(((h - 12) * Math.PI) / 12) * 12;
  const windDirectionDegrees = Math.round(220 + dirOffset);

  let windSpeedKph: number;
  let windGustsKph: number;
  let cloudCoverPercent: number;
  let weatherCode: number;
  let temperatureC: number;
  let precipitationMm = 0;
  let precipitationProbability = 0;

  if (h < 6) {
    windSpeedKph = 6 + h * 0.4;
    windGustsKph = windSpeedKph + 2;
    cloudCoverPercent = 25;
    weatherCode = 1;
    temperatureC = 7 + h * 0.3;
  } else if (h < 9) {
    windSpeedKph = 9 + (h - 6) * 1.5;
    windGustsKph = windSpeedKph + 3;
    cloudCoverPercent = 25;
    weatherCode = 1;
    temperatureC = 9 + (h - 6) * 1.5;
  } else if (h < 13) {
    windSpeedKph = 14 + (h - 9) * 1.4;
    windGustsKph = windSpeedKph + 5;
    cloudCoverPercent = 35;
    weatherCode = 2;
    temperatureC = 14 + (h - 9) * 1.2;
  } else if (h < 17) {
    windSpeedKph = 19 - (h - 13) * 0.7;
    windGustsKph = windSpeedKph + 5;
    cloudCoverPercent = 50;
    weatherCode = 2;
    temperatureC = 19 - (h - 13) * 0.4;
  } else if (h < 21) {
    windSpeedKph = 12 - (h - 17) * 1.3;
    windGustsKph = Math.max(windSpeedKph + 2, 4);
    cloudCoverPercent = 55;
    weatherCode = 3;
    temperatureC = 17 - (h - 17) * 1.5;
  } else {
    windSpeedKph = 6;
    windGustsKph = 8;
    cloudCoverPercent = 60;
    weatherCode = 3;
    temperatureC = 10;
  }

  // Day 2 (day after tomorrow): a single rainy hour at 14:00 to demonstrate
  // weather-icon + precip-cell variety in the forecast table.
  if (day === 2 && h === 14) {
    precipitationMm = 1.2;
    precipitationProbability = 80;
    weatherCode = 61;
    cloudCoverPercent = 90;
  }
  // Day 1 morning: a couple of cloudy hours
  if (day === 1 && h >= 9 && h <= 11) {
    weatherCode = 3;
    cloudCoverPercent = 75;
  }

  return {
    temperatureC: Math.round(temperatureC * 10) / 10,
    precipitationMm,
    precipitationProbability,
    cloudCoverPercent,
    weatherCode,
    windSpeedKph: Math.round(windSpeedKph * 10) / 10,
    windGustsKph: Math.round(windGustsKph * 10) / 10,
    windDirectionDegrees,
  };
};
