import type { SiteInput } from "../services/sites";
import { isValidArc, toKph, type WindArc, type WindSpeedUnit } from "./wind";

export type SiteFormErrors = {
  name?: string;
  latitude?: string;
  longitude?: string;
  wind_arcs?: string;
  club_url?: string;
  min_wind_speed?: string;
  max_wind_speed?: string;
  min_wind_gust?: string;
  max_wind_gust?: string;
};

export type SiteFormValues = {
  name: string;
  latitude: string;
  longitude: string;
  arcs: WindArc[];
  club_url: string;
  notes: string;
  min_wind_speed: string;
  max_wind_speed: string;
  min_wind_gust: string;
  max_wind_gust: string;
};

export const emptyValues = (): SiteFormValues => ({
  name: "",
  latitude: "",
  longitude: "",
  arcs: [],
  club_url: "",
  notes: "",
  min_wind_speed: "",
  max_wind_speed: "",
  min_wind_gust: "",
  max_wind_gust: "",
});

const parseArcsFromFormData = (formData: FormData): WindArc[] => {
  const froms = formData.getAll("arc_from").map((v) => String(v));
  const tos = formData.getAll("arc_to").map((v) => String(v));
  const arcs: WindArc[] = [];
  const length = Math.min(froms.length, tos.length);
  for (let i = 0; i < length; i++) {
    const from = Number.parseFloat(froms[i]);
    const to = Number.parseFloat(tos[i]);
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
    arcs.push([from, to]);
  }
  return arcs;
};

export const readFormValues = (formData: FormData): SiteFormValues => ({
  name: String(formData.get("name") ?? "").trim(),
  latitude: String(formData.get("latitude") ?? "").trim(),
  longitude: String(formData.get("longitude") ?? "").trim(),
  arcs: parseArcsFromFormData(formData),
  club_url: String(formData.get("club_url") ?? "").trim(),
  notes: String(formData.get("notes") ?? "").trim(),
  min_wind_speed: String(formData.get("min_wind_speed") ?? "").trim(),
  max_wind_speed: String(formData.get("max_wind_speed") ?? "").trim(),
  min_wind_gust: String(formData.get("min_wind_gust") ?? "").trim(),
  max_wind_gust: String(formData.get("max_wind_gust") ?? "").trim(),
});

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export type SiteFormValidation =
  | { ok: true; input: SiteInput }
  | { ok: false; errors: SiteFormErrors };

const parseOptionalSpeed = (
  raw: string,
  unit: WindSpeedUnit,
): { ok: true; value: number | null } | { ok: false } => {
  if (raw === "") return { ok: true, value: null };
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return { ok: false };
  return { ok: true, value: Math.round(toKph(n, unit) * 10) / 10 };
};

export const validateSiteForm = (
  values: SiteFormValues,
  unit: WindSpeedUnit = "kph",
): SiteFormValidation => {
  const errors: SiteFormErrors = {};

  if (!values.name || values.name.length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  const latitude = Number.parseFloat(values.latitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    errors.latitude = "Latitude must be between -90 and 90";
  }

  const longitude = Number.parseFloat(values.longitude);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    errors.longitude = "Longitude must be between -180 and 180";
  }

  if (values.arcs.length === 0) {
    errors.wind_arcs = "Add at least one wind direction arc";
  } else if (!values.arcs.every(isValidArc)) {
    errors.wind_arcs = "Arc degrees must be between 0 and 359";
  }

  if (values.club_url && !isValidUrl(values.club_url)) {
    errors.club_url = "Club URL must be a valid http(s) URL";
  }

  const minSpeed = parseOptionalSpeed(values.min_wind_speed, unit);
  if (!minSpeed.ok) {
    errors.min_wind_speed = "Must be a non-negative number";
  }
  const maxSpeed = parseOptionalSpeed(values.max_wind_speed, unit);
  if (!maxSpeed.ok) {
    errors.max_wind_speed = "Must be a non-negative number";
  }
  const minGust = parseOptionalSpeed(values.min_wind_gust, unit);
  if (!minGust.ok) {
    errors.min_wind_gust = "Must be a non-negative number";
  }
  const maxGust = parseOptionalSpeed(values.max_wind_gust, unit);
  if (!maxGust.ok) {
    errors.max_wind_gust = "Must be a non-negative number";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      name: values.name,
      latitude,
      longitude,
      wind_arcs: values.arcs,
      club_url: values.club_url || null,
      notes: values.notes || null,
      min_wind_speed_kph: minSpeed.ok ? minSpeed.value : null,
      max_wind_speed_kph: maxSpeed.ok ? maxSpeed.value : null,
      min_wind_gust_kph: minGust.ok ? minGust.value : null,
      max_wind_gust_kph: maxGust.ok ? maxGust.value : null,
    },
  };
};
