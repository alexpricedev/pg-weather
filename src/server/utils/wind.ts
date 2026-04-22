export type WindArc = [fromDegrees: number, toDegrees: number];

export type WindSpeedUnit = "kph" | "mph";

export const normalizeDegrees = (deg: number): number => {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
};

/**
 * Returns true if `deg` falls within the clockwise arc from arc[0] to arc[1].
 * Handles wrap-around (e.g. [340, 20] accepts 350 and 10).
 */
export const isDegreeInArc = (deg: number, arc: WindArc): boolean => {
  const d = normalizeDegrees(deg);
  const from = normalizeDegrees(arc[0]);
  const to = normalizeDegrees(arc[1]);
  if (from === to) return d === from;
  if (from < to) return d >= from && d <= to;
  return d >= from || d <= to;
};

export const isDegreeInAnyArc = (deg: number, arcs: WindArc[]): boolean => {
  return arcs.some((arc) => isDegreeInArc(deg, arc));
};

const CARDINALS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

export type Cardinal = (typeof CARDINALS)[number];

export const degreesToCardinal = (deg: number): Cardinal => {
  const d = normalizeDegrees(deg);
  const index = Math.round(d / 22.5) % 16;
  return CARDINALS[index];
};

export const kphToMph = (kph: number): number => kph * 0.621371;

export const mphToKph = (mph: number): number => mph / 0.621371;

export const convertWindSpeed = (kph: number, unit: WindSpeedUnit): number => {
  return unit === "mph" ? kphToMph(kph) : kph;
};

export const toKph = (value: number, unit: WindSpeedUnit): number => {
  return unit === "mph" ? mphToKph(value) : value;
};

export const formatWindSpeed = (kph: number, unit: WindSpeedUnit): string => {
  const value = convertWindSpeed(kph, unit);
  return `${Math.round(value)} ${unit}`;
};

export const formatSpeedRange = (
  minKph: number | null,
  maxKph: number | null,
  unit: WindSpeedUnit,
): string => {
  const min =
    minKph !== null ? Math.round(convertWindSpeed(minKph, unit)) : null;
  const max =
    maxKph !== null ? Math.round(convertWindSpeed(maxKph, unit)) : null;
  if (min !== null && max !== null) return `${min}–${max} ${unit}`;
  if (min !== null) return `≥ ${min} ${unit}`;
  if (max !== null) return `≤ ${max} ${unit}`;
  return "—";
};

/**
 * Human-readable short summary of accepted arcs.
 * e.g. [[200, 290]] → "SSW–WNW"; [[340, 20], [90, 135]] → "NNW–NNE, E–SE"
 */
export const formatArcSummary = (arcs: WindArc[]): string => {
  if (arcs.length === 0) return "—";
  return arcs
    .map((arc) => `${degreesToCardinal(arc[0])}–${degreesToCardinal(arc[1])}`)
    .join(", ");
};

export const parseWindArcs = (raw: unknown): WindArc[] => {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  const result: WindArc[] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const [from, to] = entry;
    if (typeof from !== "number" || typeof to !== "number") continue;
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
    result.push([normalizeDegrees(from), normalizeDegrees(to)]);
  }
  return result;
};

export const isValidArc = (arc: WindArc): boolean => {
  const [from, to] = arc;
  if (!Number.isFinite(from) || !Number.isFinite(to)) return false;
  if (from < 0 || from >= 360) return false;
  if (to < 0 || to >= 360) return false;
  return true;
};
