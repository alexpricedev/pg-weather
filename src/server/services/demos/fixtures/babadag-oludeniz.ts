import { type DemoFixture, FIXED_DATE, type HourPattern } from "./types";

const TIMEZONE = "Europe/Istanbul";

export const babadagOludeniz: DemoFixture = {
  slug: "babadag-oludeniz",
  timezone: TIMEZONE,
  timezoneAbbreviation: "TRT",
  utcOffsetSeconds: 3 * 3600,
  site: {
    id: "demo-babadag-oludeniz",
    user_id: "demo",
    name: "Babadağ · Ölüdeniz",
    latitude: 36.554,
    longitude: 29.15,
    wind_arcs: [
      [290, 360],
      [0, 30],
    ],
    club_url: null,
    notes:
      "Mediterranean launch above Ölüdeniz. Predictable northwest sea breeze in afternoons. Sample data only.",
    min_wind_speed_kph: 10,
    max_wind_speed_kph: 25,
    min_wind_gust_kph: null,
    max_wind_gust_kph: 32,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  },
  cardSummary: {
    state: "soon",
    statusLabel: "On in 2h 14m",
    windNowSummary: "WIND 8 KPH · SSE · BUILDING",
    primaryArcDegrees: 320,
    primaryWindDegrees: 165,
  },
  pattern(localHour, dayOffset) {
    return babadagPattern(localHour, dayOffset);
  },
};

const babadagPattern = (h: number, day: number): HourPattern => {
  let windDirectionDegrees: number;
  let windSpeedKph: number;
  let windGustsKph: number;
  let cloudCoverPercent: number;
  let weatherCode: number;
  let temperatureC: number;
  let precipitationMm = 0;
  let precipitationProbability = 0;

  if (h < 8) {
    // Light land breeze from the south, out of the NW launch arc.
    windDirectionDegrees = 165 + Math.round(Math.sin(h * 0.7) * 8);
    windSpeedKph = 4 + h * 0.4;
    windGustsKph = windSpeedKph + 1;
    cloudCoverPercent = 15;
    weatherCode = 1;
    temperatureC = 17 + h * 0.2;
  } else if (h < 11) {
    // Wind clocking through W, building. Still below the 10kph minimum
    // until ~10:30 and not cleanly in the NW arc until late.
    windDirectionDegrees = 250 + Math.round((h - 8) * 18);
    windSpeedKph = 6 + (h - 8) * 1.6;
    windGustsKph = windSpeedKph + 2;
    cloudCoverPercent = 20;
    weatherCode = 1;
    temperatureC = 19 + (h - 8) * 1.3;
  } else if (h < 14) {
    // Sea breeze in. Direction settles ~310 (well inside the NW arc).
    windDirectionDegrees = 305 + Math.round((h - 11) * 3);
    windSpeedKph = 13 + (h - 11) * 2;
    windGustsKph = windSpeedKph + 4;
    cloudCoverPercent = 30;
    weatherCode = 2;
    temperatureC = 24 + (h - 11) * 0.8;
  } else if (h < 18) {
    // Peak sea breeze — flyable through to 17:00.
    windDirectionDegrees = 315 + Math.round((h - 14) * 2);
    windSpeedKph = 19 - (h - 14) * 0.6;
    windGustsKph = windSpeedKph + 5;
    cloudCoverPercent = 35;
    weatherCode = 2;
    temperatureC = 26 - (h - 14) * 0.3;
  } else {
    windDirectionDegrees = 305;
    windSpeedKph = Math.max(8 - (h - 18) * 1, 3);
    windGustsKph = windSpeedKph + 2;
    cloudCoverPercent = 40;
    weatherCode = 2;
    temperatureC = 24 - (h - 18) * 0.7;
  }

  // Day 1 afternoon: a brief clouded window 14-15 to add weather-icon variety.
  if (day === 1 && (h === 14 || h === 15)) {
    weatherCode = 3;
    cloudCoverPercent = 70;
  }
  // Day 2 mid-morning: a quick light shower to demonstrate the precip cell.
  if (day === 2 && h === 9) {
    weatherCode = 61;
    precipitationMm = 0.6;
    precipitationProbability = 60;
    cloudCoverPercent = 85;
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
