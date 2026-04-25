import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { SQL } from "bun";
import { createBunRequest } from "../../test-utils/bun-request";
import { cleanupTestData } from "../../test-utils/helpers";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for tests");
}
const connection = new SQL(process.env.DATABASE_URL);

mock.module("../../services/database", () => ({
  get db() {
    return connection;
  },
}));

import { home } from "./home";

describe("Home Controller", () => {
  beforeEach(async () => {
    await cleanupTestData(connection);
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  describe("GET / (guest)", () => {
    test("renders the marketing home page in the layout", async () => {
      const request = createBunRequest("http://localhost:3000/", {
        method: "GET",
      });
      const response = await home.index(request);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/html");
      expect(html).toContain('data-page="home"');
      expect(html).toContain("<main");
    });

    test("renders the locked headline copy", async () => {
      const html = await (
        await home.index(createBunRequest("http://localhost:3000/"))
      ).text();
      expect(html).toContain("Your launches.");
      expect(html).toContain("Your limits.");
      expect(html).toMatch(/Fly\s+<span[^>]*>more<\/span>/);
    });

    test("renders both hero CTAs with correct hrefs", async () => {
      const html = await (
        await home.index(createBunRequest("http://localhost:3000/"))
      ).text();
      // Primary CTA → /login
      expect(html).toMatch(
        /<a[^>]+href="\/login"[^>]+class="btn-primary"[^>]*>\s*Add your first site/,
      );
      // Ghost CTA → /demo/<flyable-slug>
      expect(html).toMatch(/<a[^>]+href="\/demo\/[^"]+"[^>]*>\s*See a sample/);
    });

    test("renders the three demo cards linking to /demo/:slug", async () => {
      const html = await (
        await home.index(createBunRequest("http://localhost:3000/"))
      ).text();
      expect(html).toContain('href="/demo/forclaz-annecy"');
      expect(html).toContain('href="/demo/babadag-oludeniz"');
      expect(html).toContain('href="/demo/bir-billing"');
    });

    test("renders the how-it-works steps with mono numerals", async () => {
      const html = await (
        await home.index(createBunRequest("http://localhost:3000/"))
      ).text();
      expect(html).toContain("HOW IT WORKS");
      expect(html).toContain(">01<");
      expect(html).toContain(">02<");
      expect(html).toContain(">03<");
    });

    test("renders the FAQ section with all five questions", async () => {
      const html = await (
        await home.index(createBunRequest("http://localhost:3000/"))
      ).text();
      expect(html).toContain("Useful for hang gliders");
      expect(html).toContain("Is it free?");
      expect(html).toContain("What data source?");
      expect(html).toContain("Is it open source?");
      expect(html).toContain("Do you have a mobile app?");
    });

    test("footer contains Open-Meteo attribution", async () => {
      const html = await (
        await home.index(createBunRequest("http://localhost:3000/"))
      ).text();
      expect(html).toContain("Open-Meteo");
      expect(html).toContain("https://open-meteo.com");
    });

    test("does not render the old 'paragliding and skydiving' tagline", async () => {
      const html = await (
        await home.index(createBunRequest("http://localhost:3000/"))
      ).text();
      expect(html).not.toContain("paragliding and skydiving");
    });
  });
});
