import { describe, expect, test } from "bun:test";
import { readFormValues, validateSiteForm } from "./site-form";

const makeFormData = (entries: [string, string][]): FormData => {
  const fd = new FormData();
  for (const [key, value] of entries) {
    fd.append(key, value);
  }
  return fd;
};

describe("readFormValues", () => {
  test("parses paired arc_from / arc_to values", () => {
    const fd = makeFormData([
      ["name", "Mam Tor"],
      ["latitude", "53.34"],
      ["longitude", "-1.80"],
      ["arc_from", "200"],
      ["arc_to", "290"],
      ["arc_from", "340"],
      ["arc_to", "20"],
      ["club_url", "https://example.com"],
      ["notes", "watch rotor"],
      ["min_wind_speed", "12"],
      ["max_wind_speed", "35"],
      ["min_wind_gust", "18"],
      ["max_wind_gust", "50"],
    ]);

    const values = readFormValues(fd);
    expect(values.name).toBe("Mam Tor");
    expect(values.latitude).toBe("53.34");
    expect(values.longitude).toBe("-1.80");
    expect(values.arcs).toEqual([
      [200, 290],
      [340, 20],
    ]);
    expect(values.club_url).toBe("https://example.com");
    expect(values.notes).toBe("watch rotor");
    expect(values.min_wind_speed).toBe("12");
    expect(values.max_wind_speed).toBe("35");
    expect(values.min_wind_gust).toBe("18");
    expect(values.max_wind_gust).toBe("50");
  });

  test("drops arcs with non-numeric values", () => {
    const fd = makeFormData([
      ["arc_from", "10"],
      ["arc_to", "20"],
      ["arc_from", "bad"],
      ["arc_to", "30"],
    ]);
    const values = readFormValues(fd);
    expect(values.arcs).toEqual([[10, 20]]);
  });
});

describe("validateSiteForm", () => {
  const baseValues = {
    name: "Mam Tor",
    latitude: "53.34",
    longitude: "-1.80",
    arcs: [[200, 290]] as [number, number][],
    club_url: "",
    notes: "",
    min_wind_speed: "",
    max_wind_speed: "",
    min_wind_gust: "",
    max_wind_gust: "",
  };

  test("accepts a valid form", () => {
    const result = validateSiteForm(baseValues);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.name).toBe("Mam Tor");
      expect(result.input.latitude).toBeCloseTo(53.34);
      expect(result.input.longitude).toBeCloseTo(-1.8);
      expect(result.input.wind_arcs).toEqual([[200, 290]]);
      expect(result.input.club_url).toBeNull();
      expect(result.input.notes).toBeNull();
      expect(result.input.min_wind_speed_kph).toBeNull();
      expect(result.input.max_wind_speed_kph).toBeNull();
      expect(result.input.min_wind_gust_kph).toBeNull();
      expect(result.input.max_wind_gust_kph).toBeNull();
    }
  });

  test("parses all four speed overrides in kph", () => {
    const result = validateSiteForm(
      {
        ...baseValues,
        min_wind_speed: "10",
        max_wind_speed: "35",
        min_wind_gust: "15",
        max_wind_gust: "55",
      },
      "kph",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.min_wind_speed_kph).toBe(10);
      expect(result.input.max_wind_speed_kph).toBe(35);
      expect(result.input.min_wind_gust_kph).toBe(15);
      expect(result.input.max_wind_gust_kph).toBe(55);
    }
  });

  test("converts speed overrides from mph to kph", () => {
    const result = validateSiteForm(
      { ...baseValues, min_wind_speed: "10", max_wind_gust: "30" },
      "mph",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.min_wind_speed_kph).toBeCloseTo(16.1, 1);
      expect(result.input.max_wind_gust_kph).toBeCloseTo(48.3, 1);
    }
  });

  test("rejects negative speed overrides", () => {
    const result = validateSiteForm({ ...baseValues, min_wind_speed: "-1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.min_wind_speed).toBeDefined();
  });

  test("rejects negative max wind speed", () => {
    const result = validateSiteForm({ ...baseValues, max_wind_speed: "-2" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.max_wind_speed).toBeDefined();
  });

  test("rejects short names", () => {
    const result = validateSiteForm({ ...baseValues, name: "M" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBeDefined();
  });

  test("rejects out-of-range latitude", () => {
    const result = validateSiteForm({ ...baseValues, latitude: "91" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.latitude).toBeDefined();
  });

  test("rejects out-of-range longitude", () => {
    const result = validateSiteForm({ ...baseValues, longitude: "-181" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.longitude).toBeDefined();
  });

  test("rejects when no arcs provided", () => {
    const result = validateSiteForm({ ...baseValues, arcs: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.wind_arcs).toBeDefined();
  });

  test("rejects arc degrees outside [0,360)", () => {
    const result = validateSiteForm({ ...baseValues, arcs: [[0, 360]] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.wind_arcs).toBeDefined();
  });

  test("rejects invalid club URL", () => {
    const result = validateSiteForm({
      ...baseValues,
      club_url: "not a url",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.club_url).toBeDefined();
  });

  test("accepts empty club_url and notes", () => {
    const result = validateSiteForm({
      ...baseValues,
      club_url: "",
      notes: "",
    });
    expect(result.ok).toBe(true);
  });
});
