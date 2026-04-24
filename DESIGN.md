# Design System — Windrose

## Product Context

- **What this is:** Windrose is a paraglider's forecast planner. Add flying sites, set the wind direction arcs that launch each site, and check hourly forecasts for today, tomorrow, and the day after.
- **Who it's for:** Paraglider pilots deciding whether today's weather is flyable — typically checked first thing in the morning, often on a phone, with a driving decision on the line.
- **Space/industry:** Weather tools for flying — category peers are Windy, XCWeather, Meteoblue, XCTrack, paragliding club sites.
- **Project type:** Web app (dashboard-style with data-dense forecast tables and interactive instrument-like visuals).
- **Memorable thing:** At a glance, a pilot can tell if the site is flyable today. The status card is the hero. The table is proof.

## Aesthetic Direction

- **Direction:** Modernist Swiss — crisp white surfaces, one geometric sans, tight grid, one meaningful accent. Confident, restrained, tool-grade. Reference: Vercel, Raycast, Supabase docs.
- **Decoration level:** Minimal. The compass rose is the one character object. No gradients, no blobs, no illustration, no shadow beyond subtle card elevation.
- **Mood:** Calm, precise, daytime. Looks at home next to a topo map and a weather radar. Not pro-tool-dark. Not editorial. Not skeuomorphic.
- **Dark mode:** Supported as a secondary experience; light is the design centre of gravity. Redesign surfaces (not just invert) when implementing.

## Typography

One family, one job each — no monospace, no serif, no display face.

- **Family:** **Satoshi** (Indian Type Foundry, via Fontshare). Geometric modern sans, free for commercial use, strong tabular numerals.
- **Load:** `https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap`
- **Fallback:** `ui-sans-serif, system-ui, sans-serif`
- **Numeric setting:** Apply `font-variant-numeric: tabular-nums` on all forecast data, status details, coordinates, limits, and anywhere columns of numbers must align. Define a utility `.tabular`.

### Role table

| Role | Size | Weight | Tracking | Notes |
|---|---|---|---|---|
| Site title (hero display) | `clamp(40px, 6vw, 60px)` | 700 | `-0.035em` | H1 on site detail page |
| Section title (site card) | 22px | 700 | `-0.025em` | H3 in sites-index cards |
| Status headline | 26px | 700 | `-0.025em` | "Flyable now" / "On in 2h 14m" |
| Forecast H2 | 22px | 700 | `-0.02em` | "Forecast" above the table |
| Body | 15px | 400 | `-0.005em` base | Default paragraph + UI |
| UI labels (nav, meta) | 13.5–14px | 500 | `-0.005em` | Nav links, buttons, table cells |
| Table body | 13.5px | 400 | — | Forecast rows, tabular-nums |
| Table header | 10.5px | 600 | `0.14em` uppercase | All-caps micro-label |
| Eyebrow / section label | 11px | 600 | `0.18em` uppercase | Section dividers |

## Color

- **Approach:** Restrained. One accent. All state color derives from a small semantic set. High contrast on white.

### Tokens

| Token | Value | Role |
|---|---|---|
| `--bg` | `#f8f9fb` | Page background, subtle cool tint |
| `--surface` | `#ffffff` | Cards, nav bar, inputs, forecast table |
| `--surface-hover` | `#f1f4f8` | Row/button hover |
| `--border` | `#e4e7ed` | 1px dividers, card edges |
| `--border-strong` | `#cfd4dc` | Active/strong borders, input borders |
| `--text` | `#0a0e14` | Primary copy |
| `--text-muted` | `#556172` | Meta, labels, secondary |
| `--text-dim` | `#8a93a2` | Quaternary, captions |
| `--accent` | `#0369a1` | **Flyable**, primary CTA, active nav, compass arcs, compass needle |
| `--accent-strong` | `#075985` | Button hover |
| `--accent-soft` | `#e0f0fa` | Badge/chip background, icon backplate |
| `--accent-tint` | `#f3f9fd` | Flyable-row background in forecast table |
| `--soon` | `#64748b` | "Flyable soon" state |
| `--soon-soft` | `#eef1f5` | Soon badge/backplate |
| `--off` | `#9e4a4a` | "Not flyable today" (warm, not alarmist) |
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

### Compass rose

The one character object. 100×100 viewBox SVG. Outer ring `#e4e7ed` (`--border-strong`). Arcs are pie slices from centre, fill `--accent` at 12% opacity, stroke `--accent` at 0.6 width. Wind needle uses `--accent` stroke and fill. Cardinal labels `--text-muted` at 6px, weight 600. Tick marks every 30° in `--border-strong`. In the **off** state, the wind-now arrow uses `--off` colour to indicate the wind is outside the arcs.

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
- Gradient CTA buttons.
- Generic stock-photo hero sections.
- `system-ui` / `-apple-system` as the primary display or body font.
- Second accent colour "for variety."
- "Built for pilots" / "Designed for fliers" marketing tagline conventions.
- Weather icons from a generic icon pack; prefer Unicode glyphs (`☀ ⛅ ☁ 🌧 ⛈`) or a hand-curated minimal SVG set if upgrading later.

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-23 | Initial design system created | Established by `/design-consultation` based on product research (Windy, XCWeather, Meteoblue, Linear, Hello Weather) and the memorable-thing "at a glance I can see if it's flyable today." |
| 2026-04-23 | First proposal (dark-mode "pilot's instrument" with Instrument Serif + General Sans + amber) rejected | User preferred light mode and a unified geometric sans. Structural decisions (status card as hero, compass as character) carried forward. |
| 2026-04-23 | Satoshi chosen over Geist for primary family | Same modernist-Swiss energy, less ubiquitous — avoids the Vercel-font convergence trap. |
| 2026-04-23 | Accent colour: sky `#0369a1` | Domain-literate (aviation/weather), high contrast on white, distinctive without being alarmist. |
| 2026-04-24 | Renamed `pg-weather` → **Windrose**; "flyable" preserved as the in-product status verb | Working name `pg-weather` did not survive at hero display weight and framed the app as "a weather tool" rather than a site planner with a flyability verdict. Windrose maps 1:1 to the signature compass-rose visual. The brand/verb split (Windrose names the instrument; "flyable" names the state) reinforces both. Direct conflict avoided: `flyable.app` is taken by Rob Holmes' "Flyable: Flying Forecast" Android app in the same niche. See `~/.gstack/projects/alexpricedev-pg-weather/alexprice-alexpricedev-brand-name-design-20260424-071235.md`. |
