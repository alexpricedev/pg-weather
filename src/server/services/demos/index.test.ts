import { describe, expect, test } from "bun:test";
import { isFlyableHour } from "../../utils/flyability";
import {
  DEMO_SLUGS,
  getAllDemoCards,
  getDemoCardSummary,
  getDemoForecast,
  getDemoSite,
  getDemoTimezone,
} from "./index";

const REFERENCE_NOW = new Date("2026-04-25T10:00:00Z");

describe("Demos service", () => {
  test("DEMO_SLUGS exposes the three canonical launches", () => {
    expect(DEMO_SLUGS).toEqual([
      "forclaz-annecy",
      "babadag-oludeniz",
      "bir-billing",
    ]);
  });

  test("getDemoSite returns the fixture site for a known slug", () => {
    const site = getDemoSite("forclaz-annecy");
    expect(site).not.toBeNull();
    expect(site?.name).toBe("Forclaz · Annecy");
    expect(site?.user_id).toBe("demo");
    expect(site?.id).toBe("demo-forclaz-annecy");
    expect(site?.wind_arcs).toEqual([[200, 260]]);
  });

  test("getDemoSite returns null for unknown slug", () => {
    expect(getDemoSite("not-a-real-slug")).toBeNull();
    expect(getDemoSite("")).toBeNull();
  });

  test("getDemoForecast returns null for unknown slug", () => {
    expect(getDemoForecast("nope", REFERENCE_NOW)).toBeNull();
  });

  test("getDemoForecast returns 72 hourly entries", () => {
    const forecast = getDemoForecast("forclaz-annecy", REFERENCE_NOW);
    expect(forecast).not.toBeNull();
    expect(forecast?.hours.length).toBe(72);
  });

  test("forecast hours are in chronological order", () => {
    const forecast = getDemoForecast("forclaz-annecy", REFERENCE_NOW);
    const hours = forecast?.hours ?? [];
    for (let i = 1; i < hours.length; i++) {
      expect(hours[i].time.getTime()).toBeGreaterThan(
        hours[i - 1].time.getTime(),
      );
    }
  });

  test("getDemoTimezone returns the launch's IANA timezone", () => {
    expect(getDemoTimezone("forclaz-annecy")).toBe("Europe/Paris");
    expect(getDemoTimezone("babadag-oludeniz")).toBe("Europe/Istanbul");
    expect(getDemoTimezone("bir-billing")).toBe("Asia/Kolkata");
    expect(getDemoTimezone("unknown")).toBeNull();
  });

  test("each card summary advertises one of the three states", () => {
    for (const slug of DEMO_SLUGS) {
      const summary = getDemoCardSummary(slug);
      expect(summary).not.toBeNull();
      if (!summary) continue;
      expect(["now", "soon", "off"]).toContain(summary.state);
    }
  });

  test("the three cards together cover every state exactly once", () => {
    const states = DEMO_SLUGS.map((s) => getDemoCardSummary(s)?.state).sort();
    expect(states).toEqual(["now", "off", "soon"]);
  });

  test("getAllDemoCards returns name + region + arcs + summary per slug", () => {
    const cards = getAllDemoCards();
    expect(cards.length).toBe(3);
    const annecy = cards.find((c) => c.slug === "forclaz-annecy");
    expect(annecy?.name).toBe("Forclaz · Annecy");
    expect(annecy?.region).toBe("Annecy");
    expect(annecy?.arcs).toEqual([[200, 260]]);
    expect(annecy?.cardSummary.state).toBe("now");
  });

  test("Forclaz fixture produces flyable hours during the daylight window", () => {
    const site = getDemoSite("forclaz-annecy");
    const forecast = getDemoForecast("forclaz-annecy", REFERENCE_NOW);
    expect(site).not.toBeNull();
    expect(forecast).not.toBeNull();
    const range = {
      minWindKph: site?.min_wind_speed_kph ?? null,
      maxWindKph: site?.max_wind_speed_kph ?? null,
      minGustKph: site?.min_wind_gust_kph ?? null,
      maxGustKph: site?.max_wind_gust_kph ?? null,
    };
    const flyableCount =
      forecast?.hours.filter((h) =>
        // biome-ignore lint/style/noNonNullAssertion: site already asserted non-null above
        isFlyableHour(h, site!, range, "Europe/Paris"),
      ).length ?? 0;
    // 3 days, ~8 flyable hours per day = at least 18.
    expect(flyableCount).toBeGreaterThanOrEqual(18);
  });

  test("Bír Billing fixture produces zero flyable hours on day 0", () => {
    const site = getDemoSite("bir-billing");
    const forecast = getDemoForecast("bir-billing", REFERENCE_NOW);
    expect(site).not.toBeNull();
    expect(forecast).not.toBeNull();
    const range = {
      minWindKph: site?.min_wind_speed_kph ?? null,
      maxWindKph: site?.max_wind_speed_kph ?? null,
      minGustKph: site?.min_wind_gust_kph ?? null,
      maxGustKph: site?.max_wind_gust_kph ?? null,
    };
    // First 24 hours = day 0 (rain + strong NW). Should be unflyable.
    const day0Flyable =
      forecast?.hours.slice(0, 24).filter((h) =>
        // biome-ignore lint/style/noNonNullAssertion: site already asserted non-null above
        isFlyableHour(h, site!, range, "Asia/Kolkata"),
      ).length ?? 0;
    expect(day0Flyable).toBe(0);
  });

  test("Babadağ fixture demonstrates the soon-to-flyable sea-breeze ramp", () => {
    const site = getDemoSite("babadag-oludeniz");
    const forecast = getDemoForecast("babadag-oludeniz", REFERENCE_NOW);
    expect(site).not.toBeNull();
    expect(forecast).not.toBeNull();
    const range = {
      minWindKph: site?.min_wind_speed_kph ?? null,
      maxWindKph: site?.max_wind_speed_kph ?? null,
      minGustKph: site?.min_wind_gust_kph ?? null,
      maxGustKph: site?.max_wind_gust_kph ?? null,
    };
    const flyableCount =
      forecast?.hours.filter((h) =>
        // biome-ignore lint/style/noNonNullAssertion: site already asserted non-null above
        isFlyableHour(h, site!, range, "Europe/Istanbul"),
      ).length ?? 0;
    // 3 days, sea breeze flyable from ~midday to ~17:00 = at least 12.
    expect(flyableCount).toBeGreaterThanOrEqual(12);
    // The pre-dawn hours must be unflyable (calm + out of arc).
    const dawnFlyable =
      forecast?.hours.slice(0, 8).filter((h) =>
        // biome-ignore lint/style/noNonNullAssertion: site already asserted non-null above
        isFlyableHour(h, site!, range, "Europe/Istanbul"),
      ).length ?? 0;
    expect(dawnFlyable).toBe(0);
  });

  test("Bír Billing recovers to flyable conditions on later days", () => {
    const site = getDemoSite("bir-billing");
    const forecast = getDemoForecast("bir-billing", REFERENCE_NOW);
    const range = {
      minWindKph: site?.min_wind_speed_kph ?? null,
      maxWindKph: site?.max_wind_speed_kph ?? null,
      minGustKph: site?.min_wind_gust_kph ?? null,
      maxGustKph: site?.max_wind_gust_kph ?? null,
    };
    // Hours 24-71 = day 1 + day 2. Demo promises a recovery, so at least
    // one flyable hour must appear so "off TODAY" reads as time-bounded.
    const laterFlyable =
      forecast?.hours.slice(24).filter((h) =>
        // biome-ignore lint/style/noNonNullAssertion: site already asserted non-null above
        isFlyableHour(h, site!, range, "Asia/Kolkata"),
      ).length ?? 0;
    expect(laterFlyable).toBeGreaterThanOrEqual(4);
  });
});
