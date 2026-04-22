import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { SQL } from "bun";
import { cleanupTestData } from "../test-utils/helpers";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("./database", () => ({
  get db() {
    return connection;
  },
}));

import { db } from "./database";
import {
  createSite,
  deleteSite,
  getSiteById,
  getSitesForUser,
  updateSite,
} from "./sites";

const createUser = async (email: string): Promise<string> => {
  const id = randomUUID();
  await db`INSERT INTO users (id, email) VALUES (${id}, ${email})`;
  return id;
};

describe("Sites Service", () => {
  beforeEach(async () => {
    await cleanupTestData(db);
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("getSitesForUser returns empty when no sites exist", async () => {
    const userId = await createUser("empty@test.com");
    expect(await getSitesForUser(userId)).toEqual([]);
  });

  test("createSite inserts and returns a fully-typed site", async () => {
    const userId = await createUser("pilot@test.com");
    const site = await createSite(userId, {
      name: "Mam Tor",
      latitude: 53.3498,
      longitude: -1.8087,
      wind_arcs: [[200, 290]],
      club_url: "https://example.com",
      notes: "Watch for rotor.",
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });

    expect(site.id).toBeDefined();
    expect(site.user_id).toBe(userId);
    expect(site.name).toBe("Mam Tor");
    expect(site.latitude).toBeCloseTo(53.3498, 3);
    expect(site.longitude).toBeCloseTo(-1.8087, 3);
    expect(site.wind_arcs).toEqual([[200, 290]]);
    expect(site.club_url).toBe("https://example.com");
    expect(site.notes).toBe("Watch for rotor.");
    expect(site.min_wind_speed_kph).toBeNull();
    expect(site.max_wind_gust_kph).toBeNull();
    expect(site.created_at).toBeInstanceOf(Date);
  });

  test("createSite persists optional speed overrides", async () => {
    const userId = await createUser("override@test.com");
    const site = await createSite(userId, {
      name: "Kite Beach",
      latitude: 50,
      longitude: 0,
      wind_arcs: [[0, 180]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: 15,
      max_wind_speed_kph: 55,
      min_wind_gust_kph: 20,
      max_wind_gust_kph: 65,
    });

    expect(site.min_wind_speed_kph).toBe(15);
    expect(site.max_wind_speed_kph).toBe(55);
    expect(site.min_wind_gust_kph).toBe(20);
    expect(site.max_wind_gust_kph).toBe(65);

    const fetched = await getSiteById(site.id, userId);
    expect(fetched?.min_wind_speed_kph).toBe(15);
    expect(fetched?.max_wind_speed_kph).toBe(55);
    expect(fetched?.min_wind_gust_kph).toBe(20);
    expect(fetched?.max_wind_gust_kph).toBe(65);
  });

  test("sites are scoped to their owner", async () => {
    const alice = await createUser("alice@test.com");
    const bob = await createUser("bob@test.com");

    await createSite(alice, {
      name: "Alice's Site",
      latitude: 10,
      longitude: 10,
      wind_arcs: [[0, 90]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });
    await createSite(bob, {
      name: "Bob's Site",
      latitude: 20,
      longitude: 20,
      wind_arcs: [[90, 180]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });

    const aliceSites = await getSitesForUser(alice);
    const bobSites = await getSitesForUser(bob);

    expect(aliceSites).toHaveLength(1);
    expect(aliceSites[0].name).toBe("Alice's Site");
    expect(bobSites).toHaveLength(1);
    expect(bobSites[0].name).toBe("Bob's Site");
  });

  test("getSiteById enforces user scope", async () => {
    const alice = await createUser("alice@test.com");
    const bob = await createUser("bob@test.com");
    const site = await createSite(alice, {
      name: "Alice's Site",
      latitude: 0,
      longitude: 0,
      wind_arcs: [[0, 90]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });

    expect(await getSiteById(site.id, alice)).not.toBeNull();
    expect(await getSiteById(site.id, bob)).toBeNull();
  });

  test("updateSite updates editable fields", async () => {
    const userId = await createUser("pilot@test.com");
    const site = await createSite(userId, {
      name: "Original",
      latitude: 0,
      longitude: 0,
      wind_arcs: [[0, 90]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });

    const updated = await updateSite(site.id, userId, {
      name: "Renamed",
      latitude: 1,
      longitude: 2,
      wind_arcs: [
        [0, 90],
        [180, 270],
      ],
      club_url: "https://club.example",
      notes: "Updated notes",
      min_wind_speed_kph: 8,
      max_wind_speed_kph: 40,
      min_wind_gust_kph: 12,
      max_wind_gust_kph: 45,
    });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("Renamed");
    expect(updated?.latitude).toBeCloseTo(1);
    expect(updated?.longitude).toBeCloseTo(2);
    expect(updated?.wind_arcs).toEqual([
      [0, 90],
      [180, 270],
    ]);
    expect(updated?.club_url).toBe("https://club.example");
    expect(updated?.notes).toBe("Updated notes");
    expect(updated?.min_wind_speed_kph).toBe(8);
    expect(updated?.max_wind_speed_kph).toBe(40);
    expect(updated?.min_wind_gust_kph).toBe(12);
    expect(updated?.max_wind_gust_kph).toBe(45);
  });

  test("updateSite returns null when site belongs to another user", async () => {
    const alice = await createUser("alice@test.com");
    const bob = await createUser("bob@test.com");
    const site = await createSite(alice, {
      name: "Alice's Site",
      latitude: 0,
      longitude: 0,
      wind_arcs: [[0, 90]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });

    const result = await updateSite(site.id, bob, {
      name: "Hacked",
      latitude: 0,
      longitude: 0,
      wind_arcs: [[0, 90]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });
    expect(result).toBeNull();
  });

  test("deleteSite removes owned site", async () => {
    const userId = await createUser("pilot@test.com");
    const site = await createSite(userId, {
      name: "To Delete",
      latitude: 0,
      longitude: 0,
      wind_arcs: [[0, 90]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });

    expect(await deleteSite(site.id, userId)).toBe(true);
    expect(await getSiteById(site.id, userId)).toBeNull();
  });

  test("deleteSite refuses to remove another user's site", async () => {
    const alice = await createUser("alice@test.com");
    const bob = await createUser("bob@test.com");
    const site = await createSite(alice, {
      name: "Alice's Site",
      latitude: 0,
      longitude: 0,
      wind_arcs: [[0, 90]],
      club_url: null,
      notes: null,
      min_wind_speed_kph: null,
      max_wind_speed_kph: null,
      min_wind_gust_kph: null,
      max_wind_gust_kph: null,
    });

    expect(await deleteSite(site.id, bob)).toBe(false);
    expect(await getSiteById(site.id, alice)).not.toBeNull();
  });
});
