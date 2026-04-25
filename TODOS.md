# TODOs

Deferred work captured during plan-ceo-review / plan-eng-review / plan-design-review
on the home page redesign (branch: `alexpricedev/windrose-brand`).

Each TODO has enough context that someone picking it up in 3 months understands the
motivation, the current state, and where to start.

---

## P1 — One-click "Add to my sites" clone button on `/demo/:slug` pages

**What.** A button on every public `/demo/:slug` page that, in one click, clones
the demo's launch into the visitor's account: name, lat/lng, wind arcs, speed
ranges, notes. Signed-out visitors get a guest-aware login flow that triggers the
clone after they finish the magic-link auth.

**Why.** The home-page redesign deliberately drops cold pilots into a real,
working forecast page (the `/demo/:slug` pattern). Without this clone button,
the conversion step is "manually re-create this site by typing lat/lng" — the
worst step in the entire funnel, dropping right after the most-engaging moment
(reading the actual green forecast rows). With this button the funnel becomes
"see demo → one click → site is yours."

**Pros.** Closes the funnel. Massively better conversion than today. Removes
all manual data entry friction from the warm-prospect flow.

**Cons.** Small additional surface — new service method (`cloneSite(canonicalId,
userId)`), a button + form on `/demo/:slug`, a post-login redirect param to
trigger the clone after auth.

**Context.** The demo data lives in `src/server/services/demos/fixtures/`. The
clone needs to:
1. Look up the demo fixture by slug (already exposed via `getDemoSite`).
2. Construct a `SiteInput` from it (everything except `user_id` / `created_at` /
   `updated_at` carries over).
3. Call `createSite(userId, input)`.
4. Redirect to `/sites/<new-id>?state=created` so the user lands on their new
   site with the success flash.

For signed-out visitors, the existing magic-link flow already supports a
`redirect` param — need to thread the demo slug through it, e.g.,
`/login?then=/demo/<slug>?clone=1`, and on first authenticated request to that
URL, perform the clone and redirect to the new site.

**Effort.** Human ~half day / CC ~20 min. Single PR.

**Depends on.** This PR (home page redesign + `/demo/:slug` route) merging first.

**Priority.** P1. Should ship before any growth push. The home page works without
it; the funnel doesn't.

---

## P3 — Decide whether `/` redirects logged-in users to `/sites`

**What.** Already implemented at `home.tsx:11-13` (`if (ctx.isAuthenticated)
return redirect("/sites")`). This TODO is a placeholder to revisit if/when we
want logged-in users to see a dashboard summary on `/` instead of the marketing
home page.

**Why.** Not blocking anything today. Keeping the entry as a reminder that the
behaviour is intentional and worth re-evaluating once we have multi-site users.

**Effort.** Trivial decision. No code change unless we change posture.

**Priority.** P3. Revisit when there's a reason to.

---

## P3 — FAQ entry on airsports beyond paragliding

**What.** Expand the FAQ answer for "Is this useful for hang gliders / skydivers
/ sailplane pilots?" once we have actual users from those sports. Today's answer
is honest about defaults being paragliding-tuned; it should evolve into specific
guidance per sport.

**Why.** Capture real-world usage signal once it exists.

**Effort.** Content task, 30 min.

**Priority.** P3. Trigger: first non-paraglider user signs up.

---

## P3 — Public sites library / community gallery

**What.** A namespace like `/explore` where pilots can publish their own sites
for others to browse / clone. Network effect on top of the demo pattern.

**Why.** Once user count is ~100+, the demo-as-public-page pattern becomes
worth scaling: pilots can share their personal Forclaz setup with the community,
new users get hundreds of pre-configured launches to clone.

**Cons.** Content moderation surface. Privacy considerations (sharing exact
lat/lng of restricted launches). Needs a publish/unpublish flag on the `sites`
table.

**Priority.** P3. Trigger: ~100 users active on the platform.

---

## P3 — Per-launch OG card images for `/demo/:slug`

**What.** Instead of every `/demo/:slug` page sharing the same `og-image.png`,
generate one OG card per launch with the launch name + state baked in.

**Why.** Higher fidelity when share links are pasted in Slack/Twitter.

**Context.** The `scripts/generate-images.ts` already has the SVG composition
machinery. Adding per-launch cards means iterating over `DEMO_SLUGS`, building
a per-launch SVG with the launch name, and writing
`public/og-image-<slug>.png`. Layout's `og:image` then needs to read from the
template-passed prop.

**Effort.** Human ~2 hr / CC ~30 min.

**Priority.** P3. v1 ships fine with a single OG image.

---

## P3 — Embed Space Grotesk in OG card SVG

**What.** Today the OG card uses a system-font fallback because Space Grotesk
isn't embedded. The card looks OK but doesn't carry the brand exactly. Embedding
the brand font (base64 WOFF2 in the SVG `<style>`) makes the OG card look
identical to the live site's hero.

**Effort.** Human ~30 min / CC ~15 min.

**Priority.** P3. Cosmetic improvement on share previews.
