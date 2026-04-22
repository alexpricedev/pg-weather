import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import {
  buildForecastUrl,
  clearForecastCache,
  fetchForecast,
  type OpenMeteoResponse,
  parseOpenMeteoResponse,
  safeFetchForecast,
} from "./open-meteo";

const sampleResponse: OpenMeteoResponse = {
  latitude: 53.35,
  longitude: -1.81,
  timezone: "Europe/London",
  timezone_abbreviation: "GMT",
  utc_offset_seconds: 0,
  hourly: {
    time: ["2026-04-21T00:00", "2026-04-21T01:00"],
    temperature_2m: [8, 7.5],
    precipitation: [0, 0.2],
    precipitation_probability: [10, 40],
    cloud_cover: [25, 80],
    weather_code: [1, 61],
    wind_speed_10m: [18, 22],
    wind_gusts_10m: [30, 36],
    wind_direction_10m: [230, 250],
  },
};

describe("buildForecastUrl", () => {
  test("includes required query parameters", () => {
    const url = new URL(buildForecastUrl(53.35, -1.81));
    expect(url.origin + url.pathname).toBe(
      "https://api.open-meteo.com/v1/forecast",
    );
    expect(url.searchParams.get("latitude")).toBe("53.35");
    expect(url.searchParams.get("longitude")).toBe("-1.81");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("forecast_days")).toBe("3");
    expect(url.searchParams.get("wind_speed_unit")).toBe("kmh");
    const hourly = url.searchParams.get("hourly");
    expect(hourly).toContain("wind_speed_10m");
    expect(hourly).toContain("wind_direction_10m");
    expect(hourly).toContain("wind_gusts_10m");
    expect(hourly).toContain("weather_code");
  });
});

describe("parseOpenMeteoResponse", () => {
  test("maps hourly arrays into ForecastHour records", () => {
    const parsed = parseOpenMeteoResponse(sampleResponse);
    expect(parsed.timezone).toBe("Europe/London");
    expect(parsed.hours).toHaveLength(2);
    expect(parsed.hours[0].temperatureC).toBe(8);
    expect(parsed.hours[0].windSpeedKph).toBe(18);
    expect(parsed.hours[0].windDirectionDegrees).toBe(230);
    expect(parsed.hours[1].precipitationProbability).toBe(40);
    expect(parsed.hours[1].weatherCode).toBe(61);
    expect(parsed.hours[0].time).toBeInstanceOf(Date);
  });
});

describe("fetchForecast caching", () => {
  beforeEach(() => {
    clearForecastCache();
  });

  afterEach(() => {
    mock.restore();
  });

  test("caches responses by rounded lat/lon", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(sampleResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await fetchForecast(53.3498, -1.8087);
    await fetchForecast(53.3498, -1.8087);
    // Rounding to 3 decimals → same key
    await fetchForecast(53.3499, -1.8087);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test("returns a parsed SiteForecast", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(sampleResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await fetchForecast(53.35, -1.81);
    expect(result.timezone).toBe("Europe/London");
    expect(result.hours).toHaveLength(2);
  });
});

describe("safeFetchForecast", () => {
  beforeEach(() => {
    clearForecastCache();
  });

  afterEach(() => {
    mock.restore();
  });

  test("returns ok=true on success", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(sampleResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await safeFetchForecast(53.35, -1.81);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.forecast.timezone).toBe("Europe/London");
    }
  });

  test("returns ok=false on HTTP error", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Server error", {
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    const result = await safeFetchForecast(1, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("500");
    }
  });

  test("returns ok=false when fetch throws", async () => {
    spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const result = await safeFetchForecast(1, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("network down");
    }
  });
});
