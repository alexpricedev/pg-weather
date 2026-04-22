import {
  type DatabaseMutationResult,
  hasAffectedRows,
} from "../utils/database";
import { parseWindArcs, type WindArc } from "../utils/wind";
import { coerceNullableNumeric } from "./auth";
import { db } from "./database";

export type Site = {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  wind_arcs: WindArc[];
  club_url: string | null;
  notes: string | null;
  min_wind_speed_kph: number | null;
  max_wind_speed_kph: number | null;
  min_wind_gust_kph: number | null;
  max_wind_gust_kph: number | null;
  created_at: Date;
  updated_at: Date;
};

export type SiteInput = {
  name: string;
  latitude: number;
  longitude: number;
  wind_arcs: WindArc[];
  club_url: string | null;
  notes: string | null;
  min_wind_speed_kph: number | null;
  max_wind_speed_kph: number | null;
  min_wind_gust_kph: number | null;
  max_wind_gust_kph: number | null;
};

type SiteRow = {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  wind_arcs: unknown;
  club_url: string | null;
  notes: string | null;
  min_wind_speed_kph: unknown;
  max_wind_speed_kph: unknown;
  min_wind_gust_kph: unknown;
  max_wind_gust_kph: unknown;
  created_at: Date | string;
  updated_at: Date | string;
};

const toSite = (row: SiteRow): Site => ({
  id: row.id,
  user_id: row.user_id,
  name: row.name,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  wind_arcs: parseWindArcs(row.wind_arcs),
  club_url: row.club_url,
  notes: row.notes,
  min_wind_speed_kph: coerceNullableNumeric(row.min_wind_speed_kph),
  max_wind_speed_kph: coerceNullableNumeric(row.max_wind_speed_kph),
  min_wind_gust_kph: coerceNullableNumeric(row.min_wind_gust_kph),
  max_wind_gust_kph: coerceNullableNumeric(row.max_wind_gust_kph),
  created_at: new Date(row.created_at),
  updated_at: new Date(row.updated_at),
});

export const getSitesForUser = async (userId: string): Promise<Site[]> => {
  const rows = await db`
    SELECT id, user_id, name, latitude, longitude, wind_arcs,
           club_url, notes,
           min_wind_speed_kph, max_wind_speed_kph,
           min_wind_gust_kph, max_wind_gust_kph,
           created_at, updated_at
    FROM sites
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
  `;
  return (rows as SiteRow[]).map(toSite);
};

export const getSiteById = async (
  id: string,
  userId: string,
): Promise<Site | null> => {
  const rows = await db`
    SELECT id, user_id, name, latitude, longitude, wind_arcs,
           club_url, notes,
           min_wind_speed_kph, max_wind_speed_kph,
           min_wind_gust_kph, max_wind_gust_kph,
           created_at, updated_at
    FROM sites
    WHERE id = ${id} AND user_id = ${userId}
  `;
  return rows.length > 0 ? toSite(rows[0] as SiteRow) : null;
};

export const createSite = async (
  userId: string,
  input: SiteInput,
): Promise<Site> => {
  const rows = await db`
    INSERT INTO sites (
      user_id, name, latitude, longitude, wind_arcs, club_url, notes,
      min_wind_speed_kph, max_wind_speed_kph,
      min_wind_gust_kph, max_wind_gust_kph
    )
    VALUES (
      ${userId},
      ${input.name},
      ${input.latitude},
      ${input.longitude},
      ${JSON.stringify(input.wind_arcs)},
      ${input.club_url},
      ${input.notes},
      ${input.min_wind_speed_kph},
      ${input.max_wind_speed_kph},
      ${input.min_wind_gust_kph},
      ${input.max_wind_gust_kph}
    )
    RETURNING id, user_id, name, latitude, longitude, wind_arcs,
              club_url, notes,
              min_wind_speed_kph, max_wind_speed_kph,
              min_wind_gust_kph, max_wind_gust_kph,
              created_at, updated_at
  `;
  return toSite(rows[0] as SiteRow);
};

export const updateSite = async (
  id: string,
  userId: string,
  input: SiteInput,
): Promise<Site | null> => {
  const rows = await db`
    UPDATE sites
    SET name = ${input.name},
        latitude = ${input.latitude},
        longitude = ${input.longitude},
        wind_arcs = ${JSON.stringify(input.wind_arcs)},
        club_url = ${input.club_url},
        notes = ${input.notes},
        min_wind_speed_kph = ${input.min_wind_speed_kph},
        max_wind_speed_kph = ${input.max_wind_speed_kph},
        min_wind_gust_kph = ${input.min_wind_gust_kph},
        max_wind_gust_kph = ${input.max_wind_gust_kph},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id, user_id, name, latitude, longitude, wind_arcs,
              club_url, notes,
              min_wind_speed_kph, max_wind_speed_kph,
              min_wind_gust_kph, max_wind_gust_kph,
              created_at, updated_at
  `;
  return rows.length > 0 ? toSite(rows[0] as SiteRow) : null;
};

export const deleteSite = async (
  id: string,
  userId: string,
): Promise<boolean> => {
  const result = await db`
    DELETE FROM sites WHERE id = ${id} AND user_id = ${userId}
  `;
  return hasAffectedRows(result as DatabaseMutationResult);
};
