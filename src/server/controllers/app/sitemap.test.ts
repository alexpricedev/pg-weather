import { describe, expect, test } from "bun:test";
import { createBunRequest } from "../../test-utils/bun-request";
import { sitemap } from "./sitemap";

describe("Sitemap Controller", () => {
  test("GET /sitemap.xml returns 200 with application/xml", () => {
    const response = sitemap.show(
      createBunRequest("http://localhost:3000/sitemap.xml"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/xml; charset=utf-8",
    );
  });

  test("sitemap body lists root, /login, and the three demo URLs", async () => {
    const response = sitemap.show(
      createBunRequest("http://localhost:3000/sitemap.xml"),
    );
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<loc>http://localhost:3000/</loc>");
    expect(body).toContain("<loc>http://localhost:3000/login</loc>");
    expect(body).toContain(
      "<loc>http://localhost:3000/demo/forclaz-annecy</loc>",
    );
    expect(body).toContain(
      "<loc>http://localhost:3000/demo/babadag-oludeniz</loc>",
    );
    expect(body).toContain("<loc>http://localhost:3000/demo/bir-billing</loc>");
  });

  test("sitemap response sets a cache-control header", () => {
    const response = sitemap.show(
      createBunRequest("http://localhost:3000/sitemap.xml"),
    );
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
  });
});
