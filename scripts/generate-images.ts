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

// OG/Twitter card. Mirrors the home-page hero: text block on the left, the
// dashboard preview faded behind it on the right (same mask + opacity treatment
// as `.hero-preview` in src/client/pages/home.css). Text uses a system-font
// fallback because Space Grotesk isn't embedded yet. To upgrade, base64-encode
// SpaceGrotesk-Medium.woff2 and inject as @font-face in the <style> below.
const buildOgCardSvg = (previewBase64: string): string => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Mirrors .hero-preview's mask-image: linear-gradient(to bottom, black 65%, transparent).
         The mask spans only the preview's vertical band so the fade lands at the
         bottom of the preview itself, not relative to the whole canvas. -->
    <linearGradient id="preview-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="white" stop-opacity="1"/>
      <stop offset="40%" stop-color="white" stop-opacity="1"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    <mask id="preview-mask">
      <rect x="0" y="100" width="1200" height="490" fill="url(#preview-fade)"/>
    </mask>
    <linearGradient id="text-veil" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f6f9fc" stop-opacity="1"/>
      <stop offset="50%" stop-color="#f6f9fc" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#f6f9fc" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <style>
    .display { font-family: ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif; font-weight: 600; letter-spacing: -0.045em; fill: #0a1730; }
    .body    { font-family: ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif; font-weight: 400; fill: #5f7a98; }
    .stamp   { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-weight: 500; letter-spacing: 0.14em; fill: #5f7a98; text-transform: uppercase; }
    .accent  { fill: #2f80ff; }
  </style>
  <rect width="1200" height="630" fill="#f6f9fc"/>

  <!-- Dashboard preview, faded out at the bottom and behind the text column.
       Smaller (760px) and shifted right (overflow ~280px) so the headline owns
       the left half. Mirrors .hero-preview's mask + opacity in home.css. -->
  <g opacity="0.55" mask="url(#preview-mask)">
    <image href="data:image/png;base64,${previewBase64}" x="720" y="100" width="760" preserveAspectRatio="xMinYMin meet"/>
  </g>
  <!-- Veil so the text on the left stays legible over the preview. -->
  <rect x="0" y="0" width="720" height="630" fill="url(#text-veil)"/>

  <!-- Brand row -->
  <g transform="translate(80, 96)">
    <g transform="translate(20 20) scale(0.5)">
      <path d="M0 -42 C 8 -26, 8 -10, 0 0 C -8 -10, -8 -26, 0 -42 Z" fill="#2f80ff"/>
      <path d="M0 42 C 8 26, 8 10, 0 0 C -8 10, -8 26, 0 42 Z" fill="#0a1730" opacity="0.25"/>
      <path d="M-42 0 C -26 -8, -10 -8, 0 0 C -10 8, -26 8, -42 0 Z" fill="#0a1730" opacity="0.55"/>
      <path d="M42 0 C 26 -8, 10 -8, 0 0 C 10 8, 26 8, 42 0 Z" fill="#0a1730" opacity="0.55"/>
    </g>
    <text x="60" y="30" class="display" font-size="22" letter-spacing="-0.025em">Flyable Today</text>
  </g>

  <!-- Headline — mirrors .hero-headline -->
  <g transform="translate(80, 240)">
    <text x="0" y="0" class="display" font-size="76">Your launches.</text>
    <text x="0" y="92" class="display" font-size="76">Your limits.</text>
    <text x="0" y="184" class="display" font-size="76">Fly <tspan class="accent">more</tspan>.</text>
  </g>

  <!-- Subhead — trimmed from .lead -->
  <text x="80" y="510" class="body" font-size="22">Add the launches you fly. Set the wind arcs that work.</text>
  <text x="80" y="544" class="body" font-size="22">Instant clarity on the next 72 hours.</text>

  <!-- Footer stamp -->
  <text x="80" y="588" class="stamp" font-size="14">Flyable Today · flyable.today</text>
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

  const previewBuffer = await sharp(resolve(PUBLIC_DIR, "hero-preview.png"))
    .resize({ width: 760 })
    .png({ quality: 85, compressionLevel: 9 })
    .toBuffer();
  const previewBase64 = previewBuffer.toString("base64");

  await writeOne(buildOgCardSvg(previewBase64), "og-image.png", 1200, 630);
  await writeOne(APP_ICON_SVG, "favicon-16x16.png", 16, 16);
  await writeOne(APP_ICON_SVG, "favicon-32x32.png", 32, 32);
  await writeOne(APP_ICON_SVG, "apple-touch-icon.png", 180, 180);
  await writeOne(APP_ICON_SVG, "android-chrome-192x192.png", 192, 192);
  await writeOne(APP_ICON_SVG, "android-chrome-512x512.png", 512, 512);

  console.log("Done.");
};

await main();
