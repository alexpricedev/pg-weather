import type { SiteForecast } from "../open-meteo";
import type { Site } from "../sites";
import { babadagOludeniz } from "./fixtures/babadag-oludeniz";
import { birBilling } from "./fixtures/bir-billing";
import { forclazAnnecy } from "./fixtures/forclaz-annecy";
import { buildSiteForecast, type DemoCardSummary } from "./fixtures/types";

const FIXTURES = [forclazAnnecy, babadagOludeniz, birBilling] as const;

const FIXTURE_BY_SLUG = new Map(FIXTURES.map((f) => [f.slug, f]));

export const DEMO_SLUGS: readonly string[] = FIXTURES.map((f) => f.slug);

export type DemoCardEntry = {
  slug: string;
  name: string;
  region: string;
  arcs: Site["wind_arcs"];
  cardSummary: DemoCardSummary;
};

export const getDemoSite = (slug: string): Site | null => {
  return FIXTURE_BY_SLUG.get(slug)?.site ?? null;
};

export const getDemoForecast = (
  slug: string,
  now: Date,
): SiteForecast | null => {
  const fixture = FIXTURE_BY_SLUG.get(slug);
  if (!fixture) return null;
  return buildSiteForecast(fixture, now);
};

export const getDemoTimezone = (slug: string): string | null => {
  return FIXTURE_BY_SLUG.get(slug)?.timezone ?? null;
};

export const getDemoCardSummary = (slug: string): DemoCardSummary | null => {
  return FIXTURE_BY_SLUG.get(slug)?.cardSummary ?? null;
};

export const getAllDemoCards = (): DemoCardEntry[] => {
  return FIXTURES.map((f) => ({
    slug: f.slug,
    name: f.site.name,
    region: regionFromName(f.site.name),
    arcs: f.site.wind_arcs,
    cardSummary: f.cardSummary,
  }));
};

const regionFromName = (name: string): string => {
  const idx = name.indexOf("·");
  return idx === -1 ? "" : name.slice(idx + 1).trim();
};

export type { DemoCardSummary };
