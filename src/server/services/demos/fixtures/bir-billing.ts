import { type DemoFixture, FIXED_DATE, type HourPattern } from "./types";

const TIMEZONE = "Asia/Kolkata";

export const birBilling: DemoFixture = {
  slug: "bir-billing",
  timezone: TIMEZONE,
  timezoneAbbreviation: "IST",
  utcOffsetSeconds: 5 * 3600 + 30 * 60,
  site: {
    id: "demo-bir-billing",
    user_id: "demo",
    name: "Bír Billing · Himachal",
    latitude: 32.025,
    longitude: 76.726,
    wind_arcs: [[200, 260]],
    club_url: null,
    notes:
      "Himalayan thermal site, host of Paragliding World Cup. Sample data only.",
    min_wind_speed_kph: 8,
    max_wind_speed_kph: 22,
    min_wind_gust_kph: null,
    max_wind_gust_kph: 28,
    created_at: FIXED_DATE,
    updated_at: FIXED_DATE,
  },
  cardSummary: {
    state: "off",
    statusLabel: "Not flyable today",
    windNowSummary: "WIND 32 KPH · NW · OUT OF ARC · RAIN",
    primaryArcDegrees: 230,
    primaryWindDegrees: 305,
  },
  pattern(localHour, dayOffset) {
    return birPattern(localHour, dayOffset);
  },
};

const birPattern = (h: number, day: number): HourPattern => {
  // Day 0 (today): persistent rain + strong NW winds. Fully off.
  if (day === 0) {
    let weatherCode: number;
    if (h >= 10 && h < 16) {
      weatherCode = 95;
    } else if (h >= 5 && h < 22) {
      weatherCode = 63;
    } else {
      weatherCode = 61;
    }
    const sineDay = Math.sin((h * Math.PI) / 12);
    return {
      temperatureC: Math.round((14 - Math.abs(h - 14) * 0.3) * 10) / 10,
      precipitationMm: 1.5 + (h >= 12 && h < 16 ? 3 : 0),
      precipitationProbability: 95,
      cloudCoverPercent: 95,
      weatherCode,
      windSpeedKph: Math.round((28 + sineDay * 8) * 10) / 10,
      windGustsKph: Math.round((38 + sineDay * 12) * 10) / 10,
      windDirectionDegrees: 290 + Math.round(Math.sin(h * 0.5) * 18),
    };
  }

  // Day 1 (tomorrow): recovery — flyable mid-afternoon. The "off today"
  // status reads as time-bounded, not "off forever."
  if (day === 1) {
    if (h < 8) {
      return baseHour({
        wind: 7,
        gust: 10,
        dir: 220,
        weather: 3,
        cloud: 65,
        temp: 11,
      });
    }
    if (h < 11) {
      return baseHour({
        wind: 9 + (h - 8) * 0.6,
        gust: 12 + (h - 8) * 0.5,
        dir: 220,
        weather: 2,
        cloud: 40,
        temp: 13 + (h - 8) * 1.0,
      });
    }
    if (h < 17) {
      return baseHour({
        wind: 13 + (h - 11) * 0.4,
        gust: 17 + (h - 11) * 0.4,
        dir: 225,
        weather: 1,
        cloud: 25,
        temp: 17 + (h - 11) * 0.4,
      });
    }
    return baseHour({
      wind: Math.max(12 - (h - 17), 5),
      gust: Math.max(15 - (h - 17), 7),
      dir: 225,
      weather: 2,
      cloud: 40,
      temp: 17 - (h - 17),
    });
  }

  // Day 2 (day after): sustained settled flying day.
  if (h < 8) {
    return baseHour({
      wind: 6,
      gust: 8,
      dir: 215,
      weather: 1,
      cloud: 15,
      temp: 12,
    });
  }
  if (h < 17) {
    const ramp = (h - 8) * 0.5;
    return baseHour({
      wind: 11 + Math.min(ramp, 5),
      gust: 14 + Math.min(ramp, 6),
      dir: 220,
      weather: 1,
      cloud: 20,
      temp: 16 + Math.min(ramp, 6),
    });
  }
  return baseHour({
    wind: Math.max(11 - (h - 17), 4),
    gust: Math.max(14 - (h - 17), 6),
    dir: 220,
    weather: 1,
    cloud: 25,
    temp: Math.max(18 - (h - 17), 10),
  });
};

const baseHour = (input: {
  wind: number;
  gust: number;
  dir: number;
  weather: number;
  cloud: number;
  temp: number;
  precip?: number;
  prob?: number;
}): HourPattern => ({
  temperatureC: Math.round(input.temp * 10) / 10,
  precipitationMm: input.precip ?? 0,
  precipitationProbability: input.prob ?? (input.weather >= 51 ? 60 : 5),
  cloudCoverPercent: input.cloud,
  weatherCode: input.weather,
  windSpeedKph: Math.round(input.wind * 10) / 10,
  windGustsKph: Math.round(input.gust * 10) / 10,
  windDirectionDegrees: input.dir,
});
