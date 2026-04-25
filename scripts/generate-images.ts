/**
 * Generate every PNG asset under public/ from a single source-of-truth SVG.
 *
 * Run via: bun run images:generate
 *
 * Outputs:
 *   public/og-image.png            (1200x630, social card)
 *   public/favicon-16x16.png       (16x16 PNG favicon)
 *   public/favicon-32x32.png       (32x32 PNG favicon)
 *   public/apple-touch-icon.png    (180x180 iOS home-screen icon)
 *   public/android-chrome-192x192.png
 *   public/android-chrome-512x512.png
 *
 * Edit the SVG strings below to change the brand artwork, then re-run the
 * script. Generated PNGs are committed to public/ so deploys don't need a
 * generation step.
 */

import { resolve } from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = resolve(import.meta.dir, "..", "public");

// M3 streamline mark on a rounded-square dark-navy backplate (the "app icon"
// colorway from DESIGN.md). Used for favicons and the iOS home-screen icon.
const APP_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#0a1730"/>
  <g transform="translate(50 50) scale(0.85)">
    <path d="M0 -42 C 8 -26, 8 -10, 0 0 C -8 -10, -8 -26, 0 -42 Z" fill="#5aa6ff"/>
    <path d="M0 42 C 8 26, 8 10, 0 0 C -8 10, -8 26, 0 42 Z" fill="#ffffff" opacity="0.30"/>
    <path d="M-42 0 C -26 -8, -10 -8, 0 0 C -10 8, -26 8, -42 0 Z" fill="#ffffff" opacity="0.55"/>
    <path d="M42 0 C 26 -8, 10 -8, 0 0 C 10 8, 26 8, 42 0 Z" fill="#ffffff" opacity="0.55"/>
  </g>
</svg>`;

// OG/Twitter card. Text uses a system-font fallback because Space Grotesk
// isn't embedded yet. To upgrade, base64-encode SpaceGrotesk-Medium.woff2 and
// inject as @font-face in the <style> below.
const OG_CARD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <style>
    .display { font-family: ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif; font-weight: 600; letter-spacing: -0.045em; fill: #0a1730; }
    .body    { font-family: ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif; font-weight: 400; fill: #5f7a98; }
    .stamp   { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-weight: 500; letter-spacing: 0.14em; fill: #5f7a98; text-transform: uppercase; }
    .accent  { fill: #2f80ff; }
  </style>
  <rect width="1200" height="630" fill="#f6f9fc"/>

  <!-- Brand row -->
  <g transform="translate(80, 96)">
    <g transform="translate(20 20) scale(0.5)">
      <path d="M0 -42 C 8 -26, 8 -10, 0 0 C -8 -10, -8 -26, 0 -42 Z" fill="#2f80ff"/>
      <path d="M0 42 C 8 26, 8 10, 0 0 C -8 10, -8 26, 0 42 Z" fill="#0a1730" opacity="0.25"/>
      <path d="M-42 0 C -26 -8, -10 -8, 0 0 C -10 8, -26 8, -42 0 Z" fill="#0a1730" opacity="0.55"/>
      <path d="M42 0 C 26 -8, 10 -8, 0 0 C 10 8, 26 8, 42 0 Z" fill="#0a1730" opacity="0.55"/>
    </g>
    <text x="60" y="30" class="display" font-size="22" letter-spacing="-0.025em">Windrose</text>
  </g>

  <!-- Headline -->
  <g transform="translate(80, 240)">
    <text x="0" y="0" class="display" font-size="76">Your launches.</text>
    <text x="0" y="92" class="display" font-size="76">Your limits.</text>
    <text x="0" y="184" class="display" font-size="76">Today&#x27;s <tspan class="accent">verdict</tspan>.</text>
  </g>

  <!-- Subhead -->
  <text x="80" y="540" class="body" font-size="24">A flyability forecast for paragliders. Built around your launches.</text>

  <!-- Decorative compass top-right -->
  <g transform="translate(960, 220)" opacity="0.5">
    <circle cx="0" cy="0" r="180" fill="none" stroke="#2f80ff" stroke-width="0.8" opacity="0.6"/>
    <circle cx="0" cy="0" r="140" fill="none" stroke="#2f80ff" stroke-width="0.8" opacity="0.45"/>
    <circle cx="0" cy="0" r="100" fill="none" stroke="#2f80ff" stroke-width="0.8" opacity="0.3"/>
    <circle cx="0" cy="0" r="60"  fill="none" stroke="#2f80ff" stroke-width="0.8" opacity="0.2"/>
    <g fill="#123f99" opacity="0.85">
      <polygon points="0,-180 10,0 0,0 -10,0"/>
      <polygon points="0,180 10,0 0,0 -10,0" opacity="0.35"/>
      <polygon points="-180,0 0,-10 0,0 0,10" opacity="0.55"/>
      <polygon points="180,0 0,-10 0,0 0,10" opacity="0.55"/>
    </g>
    <circle cx="0" cy="0" r="6" fill="#123f99"/>
    <circle cx="0" cy="0" r="2" fill="#ffffff"/>
  </g>

  <!-- Footer stamp -->
  <text x="80" y="582" class="stamp" font-size="14">Windrose · windrose.app</text>
</svg>`;

const writeOne = async (
  svg: string,
  outName: string,
  width: number,
  height: number,
): Promise<void> => {
  const out = resolve(PUBLIC_DIR, outName);
  await sharp(Buffer.from(svg)).resize(width, height).png().toFile(out);
  console.log(`  wrote ${outName} (${width}x${height})`);
};

const main = async (): Promise<void> => {
  console.log(`Generating public/ images into ${PUBLIC_DIR}…`);

  await writeOne(OG_CARD_SVG, "og-image.png", 1200, 630);
  await writeOne(APP_ICON_SVG, "favicon-16x16.png", 16, 16);
  await writeOne(APP_ICON_SVG, "favicon-32x32.png", 32, 32);
  await writeOne(APP_ICON_SVG, "apple-touch-icon.png", 180, 180);
  await writeOne(APP_ICON_SVG, "android-chrome-192x192.png", 192, 192);
  await writeOne(APP_ICON_SVG, "android-chrome-512x512.png", 512, 512);

  console.log("Done.");
};

await main();
