# Demo fixtures

Hand-crafted launch data shown on the marketing home page (`/`) and the public
read-only sample pages (`/demo/:slug`). One file per launch. **Edit anything in
this directory and only the demo display changes** — these fixtures never touch
the production `sites` table.

## Files

- `types.ts` — shared types + the `buildSiteForecast` helper that turns a
  fixture's `pattern(localHour, dayOffset)` into a 72-hour `SiteForecast`.
- `forclaz-annecy.ts` — Annecy / France. Demonstrates the **Flyable now** state.
- `babadag-oludeniz.ts` — Ölüdeniz / Türkiye. Demonstrates the **On in N hours**
  state (sea-breeze ramp).
- `bir-billing.ts` — Bír Billing / Himachal Pradesh. Demonstrates the **Not
  flyable today** state (rain + out-of-arc winds, recovery on day 2).

## Editing a fixture

Each fixture exports a single `DemoFixture` with three editable areas:

1. **`site`** — name, lat/lng, wind arcs, speed/gust ranges, notes. These flow
   straight into the forecast table headers and the compass-rose arcs on the
   demo card. Change any field; the page picks it up on next request.
2. **`cardSummary`** — the static line displayed on the home page card
   (`statusLabel`, `windNowSummary`). The home cards do NOT compute these from
   the forecast; they're hand-written so the home page is fast and the message
   is precise. Keep in mind the state must agree with the forecast pattern,
   otherwise the home card and the `/demo/:slug` page disagree.
3. **`pattern(localHour, dayOffset)`** — returns the weather/wind values for a
   single hour in the launch's local time. Hours go 0–23, days 0–2 (today,
   tomorrow, day-after). Edit the conditional branches to change the shape of
   the day. Output fields:
   - `temperatureC` — number
   - `windSpeedKph`, `windGustsKph` — number, kph
   - `windDirectionDegrees` — 0–359 (0 = N, 90 = E, 180 = S, 270 = W)
   - `weatherCode` — WMO code (0=clear, 1=mainly clear, 2=partly cloudy,
     3=overcast, 51-55=drizzle, 61-65=rain, 71-75=snow, 80-82=showers, 95=storm)
   - `cloudCoverPercent` — 0–100
   - `precipitationMm`, `precipitationProbability` — number, mm and %

The `flyable` row tinting on the forecast table is derived from
`isFlyableHour()` in `src/server/utils/flyability.ts`. The pattern must produce
hours that:

- Sit in one of the launch's `wind_arcs` (direction match), AND
- Sit in the speed range, AND
- Sit in the gust range, AND
- Fall between 08:00 and 18:00 local

…to count as flyable. If you change `cardSummary.state`, edit the pattern so
the forecast actually demonstrates that state for most visitor times of day.

## Adding a new demo launch

1. Copy one of the fixture files to `<slug>.ts` and edit.
2. Import + register it in `../index.ts` (`FIXTURES` array).
3. Add a test case in `../index.test.ts` if the launch needs special-case
   coverage (e.g., a wind-arc that wraps midnight).
4. Run `bun run check` — TypeScript will complain if anything is mistyped.

## Removing a launch

Delete the fixture file and remove its entry from `FIXTURES` in `../index.ts`.
The home page picks up `getAllDemoCards()` so the card row shrinks
automatically. The `/demo/<deleted-slug>` route returns 404 thereafter.

## Why fixtures and not live data

The product's wedge is "your launches, your limits, your verdict." Live
universal forecast data on a marketing page would imply a universal verdict,
which contradicts the message. Fixtures also remove Open-Meteo from the
marketing-page hot path (no rate limits, no upstream-down failure mode) and
guarantee all three card states are always represented.
