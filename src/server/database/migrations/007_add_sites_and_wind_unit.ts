import type { SQL } from "bun";

export const up = async (db: SQL): Promise<void> => {
  await db`
    ALTER TABLE users
    ADD COLUMN wind_speed_unit VARCHAR(4) NOT NULL DEFAULT 'kph'
      CHECK (wind_speed_unit IN ('kph', 'mph'))
  `;

  await db`
    CREATE TABLE sites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      latitude DOUBLE PRECISION NOT NULL
        CHECK (latitude >= -90 AND latitude <= 90),
      longitude DOUBLE PRECISION NOT NULL
        CHECK (longitude >= -180 AND longitude <= 180),
      wind_arcs JSONB NOT NULL,
      club_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await db`CREATE INDEX idx_sites_user_id ON sites(user_id)`;
  await db`CREATE INDEX idx_sites_created_at ON sites(created_at)`;
};

export const down = async (db: SQL): Promise<void> => {
  await db`DROP TABLE IF EXISTS sites`;
  await db`ALTER TABLE users DROP COLUMN IF EXISTS wind_speed_unit`;
};
