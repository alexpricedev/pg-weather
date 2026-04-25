# Design System — Windrose

## Product Context

- **What this is:** Windrose is a paraglider's forecast planner. Add flying sites, set the wind direction arcs that launch each site, and check hourly forecasts for today, tomorrow, and the day after.
- **Who it's for:** Paraglider pilots deciding whether today's weather is flyable — typically checked first thing in the morning, often on a phone, with a driving decision on the line.
- **Space/industry:** Weather tools for flying — category peers are Windy, XCWeather, Meteoblue, XCTrack, paragliding club sites.
- **Project type:** Web app (dashboard-style with data-dense forecast tables and interactive instrument-like visuals).
- **Memorable thing:** At a glance, a pilot can tell if the site is flyable today. The status card is the hero. The table is proof.

## Aesthetic Direction

- **Direction:** Technical / instrument-grade. Aviation chart meets modern Swiss — bright, airy, sky-forward, calm and honest. Confident, restrained, tool-grade. The type stack reads like an instrument panel; the palette reads like a flight plan at dawn.
- **Decoration level:** Minimal. The **M3 compass mark** and the **in-product compass rose** carry the character; everything else is typography and 1px rules. No gradients on UI chrome, no blobs, no illustration, no shadow beyond subtle card elevation.
- **Mood:** Calm, precise, daytime. Looks at home next to a topo map and a weather radar. Not pro-tool-dark. Not editorial. Not skeuomorphic.
- **Dark mode:** Supported as a secondary experience; light is the design centre of gravity. Redesign surfaces (not just invert) when implementing.

## Typography

Three typefaces, each doing exactly one job. Load all three from Google Fonts.

- **Display · Space Grotesk** — wordmark and headings. Geometric with a subtle technical edge. Weight 500 at display sizes; tracking pulled tight (`-0.025em` to `-0.045em`).
- **Body · Inter** — UI copy, long-form, forms, tables. Weights 400 / 500 / 600.
- **Data · JetBrains Mono** — coordinates, altitude, wind speed, timestamps, eyebrow labels, stamp meta. Anything that would otherwise feel squishy. Weight 400 / 500.
- **Load:** `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap`
- **Fallbacks:** `ui-sans-serif, system-ui, sans-serif` for display/body; `ui-monospace, SFMono-Regular, Menlo, monospace` for data.
- **Numeric setting:** Apply `font-variant-numeric: tabular-nums` on all forecast data, status details, coordinates, limits. The `.mono` / `.instrument` / `.tabular` utilities handle this. The `.stamp` utility pairs mono + uppercase + tracking for instrument-chrome labels.

### Role table

| Role | Family | Size | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| Marketing hero | Space Grotesk | `clamp(3.25rem, 7vw, 6.5rem)` | 500 | `-0.045em` | H1 on home |
| Site title (hero display) | Space Grotesk | `clamp(40px, 6vw, 60px)` | 500 | `-0.035em` | H1 on site detail page |
| Section title | Space Grotesk | 22–24px | 500 | `-0.03em` | H2 across the app |
| Card title | Space Grotesk | 22px | 500 | `-0.015em` | H3 in sites-index cards |
| Status headline | Space Grotesk | 26px | 500 | `-0.025em` | "Flyable now" / "On in 2h 14m" |
| Body | Inter | 15px | 400 | `-0.005em` base | Default paragraph + UI |
| UI labels (nav, meta) | Inter | 13.5–14px | 500 | `-0.005em` | Nav links, buttons, table cells |
| Table body | Inter | 13.5px | 400 | — | Forecast rows, tabular-nums |
| Table header | JetBrains Mono | 10.5px | 500 | `0.14em` uppercase | All-caps micro-label |
| Eyebrow / stamp | JetBrains Mono | 11px | 400–500 | `0.14em` uppercase | Section dividers, coordinate chrome |
| How-it-works numeral | JetBrains Mono | `clamp(48px, 6vw, 72px)` | 500 | `-0.02em` tabular-nums | Hero-adjacent instrument numerals on home page only |
| DEMO chip | JetBrains Mono | 11px | 500 | `0.14em` uppercase | Inline chip beside H1 on `/demo/:slug` pages |

## Color

- **Approach:** Restrained. Two families — **altitude** (neutrals with a sky tilt) and **sky** (signal blue). Three **weather signals** (mint / amber / rose) exist only inside map data. All semantic UI colour derives from the altitude + sky families; signals never appear on chrome.

### Altitude — neutrals

| Token | Value | Role |
|---|---|---|
| `--alt-000` | `#ffffff` | Paper peak |
| `--alt-050` | `#f6f9fc` | App canvas (`--bg`) |
| `--alt-100` | `#eaf1f8` | Cloud · hover (`--surface-hover`, `--soon-soft`) |
| `--alt-200` | `#d6e3f0` | Ridge · 1px dividers (`--border`) |
| `--alt-300` | `#b6c8dc` | Hairline · strong border (`--border-strong`) |
| `--alt-400` | `#8ea4bd` | Mute · quaternary text (`--text-dim`) |
| `--alt-500` | `#5f7a98` | Secondary text (`--text-muted`, `--soon`) |
| `--alt-600` | `#3e5775` | Body dark |
| `--alt-700` | `#27405e` | Heading dark |
| `--alt-800` | `#16294a` | Dark surface |
| `--alt-900` | `#0a1730` | **Ink** · primary text (`--text`), dark-mode surface, dark CTA |

### Sky — signal

| Token | Value | Role |
|---|---|---|
| `--sky-300` | `#8ec8ff` | Hover |
| `--sky-400` | `#5aa6ff` | Light UI, reversed accent on ink |
| `--sky-500` | `#2f80ff` | **Primary** · brand accent, links, compass needle, flyable state (`--accent`) |
| `--sky-600` | `#1a5fd9` | Pressed (`--accent-strong`) |
| `--sky-700` | `#123f99` | Deep, compass hero detail |

Supporting semantic aliases: `--accent-soft` `#e6f0ff`, `--accent-tint` `#f2f7ff`.

### Weather signals — map data only, never chrome

| Token | Value | Role |
|---|---|---|
| `--signal-mint` | `#2fd6a1` | Safe / VFR — launch sites, flyable indicators on map |
| `--signal-amber` | `#ffb547` | Caution · thermal hotspot |
| `--signal-rose` | `#ff6b8a` | Restricted airspace · do-not-fly |

**Rule of three:** any single map viewport shows at most one severity signal. If mint, amber, and rose all appear simultaneously, the map is doing too many jobs — split the layer.

### Status tokens (preserved)

| Token | Value | Role |
|---|---|---|
| `--off` | `#9e4a4a` | "Not flyable today" — warm, not alarmist. Deliberately not `--signal-rose`; status cards sit on chrome, not map. |
| `--off-soft` | `#f7ebe8` | Off badge/backplate |
| `--success` | `#1b7a4a` | Flash success |
| `--warn` | `#a36600` | Flash warning |
| `--danger` | `#b3302d` | Destructive actions, error flash |

### Dark mode tokens (secondary experience)

| Token | Value |
|---|---|
| `--bg` | `#0a0d10` |
| `--surface` | `#12161b` |
| `--border` | `#1e242c` |
| `--border-strong` | `#2a313b` |
| `--text` | `#e8ebef` |
| `--text-muted` | `#8b95a1` |
| `--accent` | `#4ea8d8` (raised for contrast) |
| `--accent-strong` | `#6ebbe4` |
| `--accent-soft` | `#12303d` |
| `--accent-tint` | `#0e1f28` |

Do not mechanically invert. Always verify contrast against the surface.

## Spacing

- **Base unit:** 4px.
- **Density:** Comfortable-dense inside forecast tables and limits; generous around hero (site title, status card, section dividers).
- **Scale:** `--s-1: 4px`, `--s-2: 8px`, `--s-3: 12px`, `--s-4: 16px`, `--s-5: 24px`, `--s-6: 32px`, `--s-7: 48px`, `--s-8: 64px`, `--s-9: 96px`.

## Layout

- **Approach:** Hybrid. Site-detail page uses a **poster + support** composition (status card dominates the viewport above the fold, forecast is evidence). Sites index, forms, and settings use **grid-disciplined** layouts.
- **Grid:** 12-column implicit. Content max-width **1120px**. Section gutter `--s-5` (24px) at desktop, `--s-4` (16px) at mobile.
- **Site detail grid:** `320px 1fr` (compass/meta on left, forecast on right). Collapses to single column under 860px.
- **Border radius:** Hierarchical and restrained. `--radius-sm: 4px` (inputs, buttons, badges, small chips). `--radius-md: 6px` (cards, status card, table container). `--radius-lg: 10px` (reserved; only for large media containers). **No bubble-radius everywhere.**
- **Elevation:** Single token. Cards sit on `--surface` with a 1px border; no shadows by default. A subtle shadow is acceptable on raised overlays (popovers, modals).

## Motion

- **Approach:** Minimal-functional. Motion communicates state change; it does not decorate.
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`.
- **Duration:** micro 80–120ms (hover, focus), short 150–250ms (state change), medium 300–400ms (needle rotation, tab switch). No `> 400ms` animations.
- **Specific animations allowed:**
  - Wind-compass needle rotates between hourly updates (medium).
  - Status-card color transition when state changes (short).
  - Button/row hover background (micro).
  - Tab switch fade (short).
- **Forbidden:** scroll-driven choreography, entrance animations on page load, bounce/spring easing, shimmer/skeleton loaders on server-rendered content.

## Signature Components

### M3 mark (logo)

Four streamline blades radiating from a shared centre on the N / S / E / W axes. Strict 4-fold cardinal symmetry. One mark, three tones:

| Blade | Colour | Opacity |
|---|---|---|
| North | `--sky-500` (`#2F80FF`) | 1.0 |
| East / West | `--alt-900` (`#0A1730`) | 0.55 |
| South | `--alt-900` (`#0A1730`) | 0.25 |
| Centre | Shared origin — no pivot dot | — |

- **Min legible size:** 16px screen, 6mm print.
- **Reversed on ink:** North uses `--sky-400`, E/W/S white at 0.55 / 0.55 / 0.30.
- **On sky (photo-safe):** all four blades `--alt-900`, opacities 1.0 / 0.6 / 0.6 / 0.3.
- **App icon:** the mark on a 20-radius rounded-square in `--alt-900` with the reversed-on-ink colourway.
- **Clear space:** equal to the cap-height of "o" in Windrose on all sides.
- **Wordmark pairing:** Space Grotesk Medium, tracking `-0.035em`.

The mark is the only multi-colour surface in the UI chrome. It uses hardcoded fills — not `currentColor` — because blade weight is semantic, not decorative.

### Compass rose (in-product)

Distinct from the M3 mark: this is the wind-direction instrument rendered on site cards and site-detail pages. 100×100 viewBox SVG. Outer ring `--border-strong`. Arcs are pie slices from centre, fill `--accent` at 12% opacity, stroke `--accent` at 0.6 width. Wind needle uses `--accent` stroke and fill. Cardinal labels `--text-muted` at 6px, weight 600. Tick marks every 30° in `--border-strong`. In the **off** state, the wind-now arrow uses `--off` colour to indicate the wind is outside the arcs.

### Status card

The hero of site-detail pages. Left-side 3px coloured stripe in `--accent` / `--soon` / `--off`. Icon in `--radius-sm` tinted square. Three-line body: eyebrow label (11px, 600, uppercase, muted), headline (26px, 700, coloured), detail (13px, muted, tabular-nums). Use on every site-detail page at the top of the content area.

### Forecast table

- `border-collapse: collapse`, hairline row dividers `--border`.
- Flyable rows: background `--accent-tint`, left inset shadow `inset 2px 0 0 --accent` on the first cell. Direction label in `--accent` at weight 500 on flyable rows.
- All numeric cells: `font-variant-numeric: tabular-nums`.
- Table headers: 10.5px, 600, 0.14em tracking, uppercase, muted.
- Hover: row background `--surface-hover` (or a mix when flyable).

### Site card (sites index)

Three-region card: title + meta on top-left, status badge top-right, mini 80×80 compass rose bottom-right. `--radius-md` corners, 1px `--border`, hover lifts 1px with `--border-strong`.

### Buttons

- **Primary:** `--accent` background, white text, `--radius-sm`, 8px × 14px padding, weight 600, 13.5px.
- **Ghost:** transparent background, `--text` color, `--border-strong` border, hover `--surface-hover`.
- **Danger:** transparent background, `--off` color and border.

### Badges

Small rounded rectangles, weight 600, 10.5px, 0.14em tracking, uppercase. Flyable uses `--accent-soft` bg with `--accent` text; Soon uses `--soon-soft` with `--soon`; Off uses `--off-soft` with `--off`.

## Accessibility

- Minimum body contrast 4.5:1 on `--surface`. `--text` on `--surface` is well above this.
- Status state must not rely on colour alone. The status card pairs colour with an icon and a text label ("Flyable now" / "On in 2h 14m" / "Not flyable today"). The forecast table pairs flyable-row tint with a left inset stripe.
- Focus rings use `--accent` at 3px spread via `box-shadow: 0 0 0 3px var(--accent-soft)`. Never remove focus rings without a stronger replacement.
- All compass roses have a `<title>` element with an accessible label.

## Anti-Patterns (never introduce)

- Purple or violet gradients.
- 3-column feature grid with icons in coloured circles.
- Centred-everything layouts.
- Bubble border-radius on all elements.
- Gradient CTA buttons. (The marketing dark-pill CTA in `--alt-900` is the one exception.)
- Generic stock-photo hero sections.
- `system-ui` / `-apple-system` as the primary display or body font.
- A fourth typeface. Space Grotesk / Inter / JetBrains Mono is the whole stack.
- Signal colours (mint / amber / rose) on UI chrome — they live on the map only.
- Second accent colour "for variety."
- "Built for pilots" / "Designed for fliers" marketing tagline conventions.
- Weather icons from a generic icon pack; prefer Unicode glyphs (`☀ ⛅ ☁ 🌧 ⛈`) or a hand-curated minimal SVG set if upgrading later.
- Mark redesigns not based on the M3 streamline. If a new variant is needed, extend the four-blade vocabulary, do not abandon it.

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-23 | Initial design system created | Established by `/design-consultation` based on product research (Windy, XCWeather, Meteoblue, Linear, Hello Weather) and the memorable-thing "at a glance I can see if it's flyable today." |
| 2026-04-23 | First proposal (dark-mode "pilot's instrument" with Instrument Serif + General Sans + amber) rejected | User preferred light mode and a unified geometric sans. Structural decisions (status card as hero, compass as character) carried forward. |
| 2026-04-23 | Satoshi chosen over Geist for primary family | Same modernist-Swiss energy, less ubiquitous — avoids the Vercel-font convergence trap. |
| 2026-04-23 | Accent colour: sky `#0369a1` | Domain-literate (aviation/weather), high contrast on white, distinctive without being alarmist. |
| 2026-04-24 | Renamed `pg-weather` → **Windrose**; "flyable" preserved as the in-product status verb | Working name `pg-weather` did not survive at hero display weight and framed the app as "a weather tool" rather than a site planner with a flyability verdict. Windrose maps 1:1 to the signature compass-rose visual. The brand/verb split (Windrose names the instrument; "flyable" names the state) reinforces both. Direct conflict avoided: `flyable.app` is taken by Rob Holmes' "Flyable: Flying Forecast" Android app in the same niche. See `~/.gstack/projects/alexpricedev-pg-weather/alexprice-alexpricedev-brand-name-design-20260424-071235.md`. |
| 2026-04-24 | Brand system v0.1 locked: **M3 streamline mark**, altitude + sky palette, Space Grotesk / Inter / JetBrains Mono stack, "Your personal three-day forecast" tagline | Ran brand exploration in Claude Design. Rejected three initial directions (Cartographer / Instrument / Thermal) then explored eight abstract streamline refinements; landed on **M3 · North** — a four-blade mark with strict 4-fold cardinal symmetry, no floral curves. Aesthetic shifted from Modernist Swiss → aviation-instrument: display font moved from Satoshi (geometric-ubiquitous) to Space Grotesk (technical edge), added JetBrains Mono specifically for data/stamp chrome so numbers stop feeling squishy. Accent shifted from `#0369a1` (deep sky) to `#2f80ff` (sky/500) for a brighter, more atmospheric read. Status `--off` held at terracotta `#9e4a4a` — signal-rose is reserved for map severity. |
