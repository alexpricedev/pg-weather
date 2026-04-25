import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PACKAGE_DIR = resolve(
  import.meta.dir,
  "../../../node_modules/@meteocons/svg",
);
const ALLOWED_STYLES = new Set(["line", "monochrome", "flat", "fill"]);

const ALLOWED_SLUGS = new Set([
  "clear-day",
  "mostly-clear-day",
  "partly-cloudy-day",
  "overcast-day",
  "fog-day",
  "drizzle",
  "extreme-drizzle",
  "sleet",
  "partly-cloudy-day-rain",
  "rain",
  "extreme-rain",
  "partly-cloudy-day-snow",
  "snow",
  "extreme-snow",
  "snowflake",
  "thunderstorms",
  "thunderstorms-extreme-rain",
  "not-available",
]);

const cache = new Map<string, string>();

const stripAnimations = (svg: string): string =>
  svg
    .replace(/<animate[^>]*>[\s\S]*?<\/animate[^>]*>/g, "")
    .replace(/<animate[^>]*\/>/g, "")
    .replace(/<animateTransform[^>]*>[\s\S]*?<\/animateTransform>/g, "")
    .replace(/<animateTransform[^>]*\/>/g, "");

// Monochrome icons hard-code black; rewrite so they inherit `color` via CSS.
// White fills (clipPath rects) must stay white to act as masks correctly.
const recolorMonochrome = (svg: string): string =>
  svg
    .replace(/="black"/g, '="currentColor"')
    .replace(/="#000000"/gi, '="currentColor"')
    .replace(/="#000"/gi, '="currentColor"');

const loadIcon = (slug: string, style: string): string | null => {
  if (!ALLOWED_SLUGS.has(slug) || !ALLOWED_STYLES.has(style)) {
    return null;
  }
  const cacheKey = `${style}/${slug}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;
  const raw = readFileSync(`${PACKAGE_DIR}/${style}/${slug}.svg`, "utf8");
  let svg = stripAnimations(raw);
  if (style === "monochrome") svg = recolorMonochrome(svg);
  cache.set(cacheKey, svg);
  return svg;
};

export const getWeatherIconSvg = (slug: string, style = "monochrome"): string =>
  loadIcon(slug, style) ?? "";

export const getWeatherIconResponse = (
  slug: string,
  style = "monochrome",
): Response => {
  const svg = loadIcon(slug, style);
  if (svg === null) return new Response("Not found", { status: 404 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
