import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BunRequest } from "bun";
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

import { demo } from "./demo";

const VALID_SLUG = "forclaz-annecy";

const demoRequest = (slug: string, qs = ""): BunRequest<"/demo/:slug"> =>
  createBunRequest<"/demo/:slug">(
    `http://localhost:3000/demo/${slug}${qs}`,
    {},
    { slug },
  );

describe("Demo Controller", () => {
  beforeEach(async () => {
    await cleanupTestData(connection);
  });

  afterAll(async () => {
    await connection.end();
    mock.restore();
  });

  test("GET /demo/:slug renders the SiteShow with sample chip and 200 status", async () => {
    const response = await demo.show(demoRequest(VALID_SLUG));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(html).toContain('data-page="demo"');
    expect(html).toContain("Forclaz");
    expect(html).toContain("demo-chip");
    expect(html).toContain(">Demo<");
  });

  test("GET /demo/:slug does NOT render an Edit button or per-site edit link", async () => {
    const response = await demo.show(demoRequest(VALID_SLUG));
    const html = await response.text();
    // No /sites/<id>/edit href should appear (the edit affordance is hidden)
    expect(html).not.toContain('/edit"');
    expect(html).not.toMatch(/>\s*Edit\s*</);
  });

  test("GET /demo/:slug shows guest nav (Login link, no Logout button)", async () => {
    const response = await demo.show(demoRequest(VALID_SLUG));
    const html = await response.text();
    expect(html).toMatch(/<a[^>]+href="\/login"/);
    expect(html).not.toContain('action="/auth/logout"');
  });

  test("GET /demo/:slug forecast tab links go to /demo/:slug, not /sites/:id", async () => {
    const response = await demo.show(demoRequest(VALID_SLUG));
    const html = await response.text();
    expect(html).toContain(`href="/demo/${VALID_SLUG}?day=`);
    expect(html).not.toContain("/sites/demo-");
  });

  test("GET /demo/:slug breadcrumb points back to home, not /sites", async () => {
    const response = await demo.show(demoRequest(VALID_SLUG));
    const html = await response.text();
    expect(html).toMatch(/<a[^>]+href="\/"[^>]*>\s*←\s*Home/);
    expect(html).not.toMatch(/href="\/sites"[^>]*>\s*←\s*All sites/);
  });

  test("GET /demo/<unknown> returns 404 with the not-found page", async () => {
    const response = await demo.show(demoRequest("not-a-real-slug"));
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(html).toContain("Sample not found");
    expect(html).toContain("/demo/forclaz-annecy");
    expect(html).toContain("/demo/babadag-oludeniz");
    expect(html).toContain("/demo/bir-billing");
  });

  test("GET /demo/:slug?day=1 returns 200 (forecast day index resolved)", async () => {
    const response = await demo.show(demoRequest(VALID_SLUG, "?day=1"));
    expect(response.status).toBe(200);
  });
});
