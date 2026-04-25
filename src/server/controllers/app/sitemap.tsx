import type { BunRequest } from "bun";
import { DEMO_SLUGS } from "../../services/demos";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

const PUBLIC_PATHS: readonly string[] = ["/", "/login"];

const buildSitemap = (origin: string): string => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    ...PUBLIC_PATHS,
    ...DEMO_SLUGS.map((slug) => `/demo/${slug}`),
  ].map(
    (path) => `  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.7"}</priority>
  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
};

export const sitemap = {
  show(_req: BunRequest): Response {
    const body = buildSitemap(SITE_URL);
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  },
};
