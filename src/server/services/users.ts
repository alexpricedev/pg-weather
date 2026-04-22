import {
  type DatabaseMutationResult,
  hasAffectedRows,
} from "../utils/database";
import { toUser, type User, type WindSpeedUnit } from "./auth";
import { db } from "./database";

export type { User, WindSpeedUnit };

export type UserSettingsInput = {
  wind_speed_unit: WindSpeedUnit;
  min_wind_speed_kph: number | null;
  max_wind_speed_kph: number | null;
  min_wind_gust_kph: number | null;
  max_wind_gust_kph: number | null;
};

export const getUsers = async (): Promise<User[]> => {
  const results = await db`
    SELECT id, email, role, wind_speed_unit,
           min_wind_speed_kph, max_wind_speed_kph,
           min_wind_gust_kph, max_wind_gust_kph,
           created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return (results as Parameters<typeof toUser>[0][]).map(toUser);
};

export const updateWindSpeedUnit = async (
  userId: string,
  unit: WindSpeedUnit,
): Promise<boolean> => {
  const result = await db`
    UPDATE users SET wind_speed_unit = ${unit} WHERE id = ${userId}
  `;
  return hasAffectedRows(result as DatabaseMutationResult);
};

export const updateUserSettings = async (
  userId: string,
  input: UserSettingsInput,
): Promise<boolean> => {
  const result = await db`
    UPDATE users
    SET wind_speed_unit = ${input.wind_speed_unit},
        min_wind_speed_kph = ${input.min_wind_speed_kph},
        max_wind_speed_kph = ${input.max_wind_speed_kph},
        min_wind_gust_kph = ${input.min_wind_gust_kph},
        max_wind_gust_kph = ${input.max_wind_gust_kph}
    WHERE id = ${userId}
  `;
  return hasAffectedRows(result as DatabaseMutationResult);
};
