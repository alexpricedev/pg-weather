import { describe, expect, test } from "bun:test";
import {
  convertWindSpeed,
  degreesToCardinal,
  formatArcSummary,
  formatSpeedRange,
  formatWindSpeed,
  isDegreeInAnyArc,
  isDegreeInArc,
  isValidArc,
  kphToMph,
  normalizeDegrees,
  parseWindArcs,
} from "./wind";

describe("normalizeDegrees", () => {
  test("leaves values in [0, 360) unchanged", () => {
    expect(normalizeDegrees(0)).toBe(0);
    expect(normalizeDegrees(180)).toBe(180);
    expect(normalizeDegrees(359)).toBe(359);
  });

  test("wraps 360 to 0", () => {
    expect(normalizeDegrees(360)).toBe(0);
  });

  test("wraps values over 360", () => {
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(720)).toBe(0);
  });

  test("wraps negative values", () => {
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(-370)).toBe(350);
  });
});

describe("isDegreeInArc", () => {
  test("simple arc without wrap", () => {
    expect(isDegreeInArc(250, [200, 290])).toBe(true);
    expect(isDegreeInArc(200, [200, 290])).toBe(true);
    expect(isDegreeInArc(290, [200, 290])).toBe(true);
    expect(isDegreeInArc(199, [200, 290])).toBe(false);
    expect(isDegreeInArc(291, [200, 290])).toBe(false);
    expect(isDegreeInArc(10, [200, 290])).toBe(false);
  });

  test("arc that wraps through 360", () => {
    const arc: [number, number] = [340, 20];
    expect(isDegreeInArc(350, arc)).toBe(true);
    expect(isDegreeInArc(0, arc)).toBe(true);
    expect(isDegreeInArc(10, arc)).toBe(true);
    expect(isDegreeInArc(340, arc)).toBe(true);
    expect(isDegreeInArc(20, arc)).toBe(true);
    expect(isDegreeInArc(21, arc)).toBe(false);
    expect(isDegreeInArc(339, arc)).toBe(false);
    expect(isDegreeInArc(180, arc)).toBe(false);
  });

  test("long-way-around arc is honoured", () => {
    // [290, 200] means WNW clockwise through N, E, S to SSW.
    const arc: [number, number] = [290, 200];
    expect(isDegreeInArc(300, arc)).toBe(true);
    expect(isDegreeInArc(0, arc)).toBe(true);
    expect(isDegreeInArc(90, arc)).toBe(true);
    expect(isDegreeInArc(180, arc)).toBe(true);
    expect(isDegreeInArc(200, arc)).toBe(true);
    expect(isDegreeInArc(250, arc)).toBe(false);
  });

  test("same from and to only matches that single degree", () => {
    expect(isDegreeInArc(100, [100, 100])).toBe(true);
    expect(isDegreeInArc(101, [100, 100])).toBe(false);
  });
});

describe("isDegreeInAnyArc", () => {
  test("matches if any arc contains the degree", () => {
    const arcs: [number, number][] = [
      [200, 290],
      [340, 20],
    ];
    expect(isDegreeInAnyArc(250, arcs)).toBe(true);
    expect(isDegreeInAnyArc(10, arcs)).toBe(true);
    expect(isDegreeInAnyArc(100, arcs)).toBe(false);
  });

  test("returns false on empty arc list", () => {
    expect(isDegreeInAnyArc(100, [])).toBe(false);
  });
});

describe("degreesToCardinal", () => {
  test("converts cardinal points", () => {
    expect(degreesToCardinal(0)).toBe("N");
    expect(degreesToCardinal(90)).toBe("E");
    expect(degreesToCardinal(180)).toBe("S");
    expect(degreesToCardinal(270)).toBe("W");
  });

  test("converts intercardinals", () => {
    expect(degreesToCardinal(45)).toBe("NE");
    expect(degreesToCardinal(135)).toBe("SE");
    expect(degreesToCardinal(225)).toBe("SW");
    expect(degreesToCardinal(315)).toBe("NW");
  });

  test("converts secondary intercardinals", () => {
    expect(degreesToCardinal(22.5)).toBe("NNE");
    expect(degreesToCardinal(202.5)).toBe("SSW");
  });

  test("wraps values >= 360", () => {
    expect(degreesToCardinal(360)).toBe("N");
    expect(degreesToCardinal(361)).toBe("N");
  });
});

describe("wind speed conversion", () => {
  test("kphToMph roughly matches known values", () => {
    expect(kphToMph(0)).toBeCloseTo(0);
    expect(kphToMph(100)).toBeCloseTo(62.1371, 3);
  });

  test("convertWindSpeed returns kph unchanged for kph", () => {
    expect(convertWindSpeed(30, "kph")).toBe(30);
  });

  test("convertWindSpeed converts for mph", () => {
    expect(convertWindSpeed(100, "mph")).toBeCloseTo(62.1371, 3);
  });

  test("formatWindSpeed rounds and suffixes", () => {
    expect(formatWindSpeed(30, "kph")).toBe("30 kph");
    expect(formatWindSpeed(30, "mph")).toBe("19 mph");
  });
});

describe("formatSpeedRange", () => {
  test("both bounds set", () => {
    expect(formatSpeedRange(10, 30, "kph")).toBe("10–30 kph");
  });

  test("only min", () => {
    expect(formatSpeedRange(10, null, "kph")).toBe("≥ 10 kph");
  });

  test("only max", () => {
    expect(formatSpeedRange(null, 30, "kph")).toBe("≤ 30 kph");
  });

  test("neither", () => {
    expect(formatSpeedRange(null, null, "kph")).toBe("—");
  });

  test("converts to mph", () => {
    expect(formatSpeedRange(16, 48, "mph")).toBe("10–30 mph");
  });
});

describe("formatArcSummary", () => {
  test("single arc", () => {
    expect(formatArcSummary([[200, 290]])).toBe("SSW–WNW");
  });

  test("multiple arcs", () => {
    expect(
      formatArcSummary([
        [340, 20],
        [90, 135],
      ]),
    ).toBe("NNW–NNE, E–SE");
  });

  test("empty arcs", () => {
    expect(formatArcSummary([])).toBe("—");
  });
});

describe("parseWindArcs", () => {
  test("parses a valid JSON payload", () => {
    const raw = [
      [200, 290],
      [340, 20],
    ];
    expect(parseWindArcs(raw)).toEqual([
      [200, 290],
      [340, 20],
    ]);
  });

  test("drops invalid entries", () => {
    const raw = [[200, 290], "bogus", [1, 2, 3], ["a", "b"]];
    expect(parseWindArcs(raw)).toEqual([[200, 290]]);
  });

  test("returns empty array for non-array input", () => {
    expect(parseWindArcs(null)).toEqual([]);
    expect(parseWindArcs({})).toEqual([]);
    expect(parseWindArcs("oops")).toEqual([]);
  });

  test("normalizes wrap-around values", () => {
    expect(parseWindArcs([[-10, 380]])).toEqual([[350, 20]]);
  });
});

describe("isValidArc", () => {
  test("valid arc", () => {
    expect(isValidArc([0, 90])).toBe(true);
    expect(isValidArc([340, 20])).toBe(true);
    expect(isValidArc([0, 0])).toBe(true);
  });

  test("out of range rejected", () => {
    expect(isValidArc([-1, 90])).toBe(false);
    expect(isValidArc([0, 360])).toBe(false);
    expect(isValidArc([360, 0])).toBe(false);
  });

  test("non-finite rejected", () => {
    expect(isValidArc([Number.NaN, 0])).toBe(false);
    expect(isValidArc([0, Number.POSITIVE_INFINITY])).toBe(false);
  });
});
