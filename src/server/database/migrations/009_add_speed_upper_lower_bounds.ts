import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    ALTER TABLE users
    ADD COLUMN max_wind_speed_kph NUMERIC(5, 1) NULL
      CHECK (max_wind_speed_kph IS NULL OR max_wind_speed_kph >= 0)
  `;
  await db`
    ALTER TABLE users
    ADD COLUMN min_wind_gust_kph NUMERIC(5, 1) NULL
      CHECK (min_wind_gust_kph IS NULL OR min_wind_gust_kph >= 0)
  `;

  await db`
    ALTER TABLE sites
    ADD COLUMN max_wind_speed_kph NUMERIC(5, 1) NULL
      CHECK (max_wind_speed_kph IS NULL OR max_wind_speed_kph >= 0)
  `;
  await db`
    ALTER TABLE sites
    ADD COLUMN min_wind_gust_kph NUMERIC(5, 1) NULL
      CHECK (min_wind_gust_kph IS NULL OR min_wind_gust_kph >= 0)
  `;
};

export const down = async (db: SQL): Promise<void> => {
  await db`ALTER TABLE sites DROP COLUMN IF EXISTS min_wind_gust_kph`;
  await db`ALTER TABLE sites DROP COLUMN IF EXISTS max_wind_speed_kph`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS min_wind_gust_kph`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS max_wind_speed_kph`;
};
