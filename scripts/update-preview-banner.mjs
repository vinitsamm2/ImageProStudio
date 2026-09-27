import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const BANNER_PATH = path.join(ROOT_DIR, 'public', 'preview-banner.png');
const LOGO_PATH = path.join(ROOT_DIR, 'public', 'logo.png');

async function updateBanner() {
  console.log('1. Reading current banner metadata...');
  const metadata = await sharp(BANNER_PATH).metadata();
  console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);

  // Resize official logo.png to 68x68 with Lanczos3 resampling for crisp clarity
  console.log('2. Resizing official logo.png for banner placement...');
  const logoResized = await sharp(LOGO_PATH)
    .resize(68, 68, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  // Dark backdrop blend patch covering the old top-left camera and text
  const patchSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="500" height="140" viewBox="0 0 500 140">
    <defs>
      <linearGradient id="bgMeltX" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#111618" stop-opacity="1" />
        <stop offset="0.75" stop-color="#111618" stop-opacity="1" />
        <stop offset="1" stop-color="#111618" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="bgMeltY" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#111618" stop-opacity="1" />
        <stop offset="0.75" stop-color="#111618" stop-opacity="1" />
        <stop offset="1" stop-color="#111618" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="proGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#22d3ee" />
        <stop offset="1" stop-color="#2dd4bf" />
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="500" height="140" fill="url(#bgMeltX)" />
    <rect x="0" y="0" width="500" height="140" fill="url(#bgMeltY)" />

    <!-- Typography Group -->
    <g transform="translate(128, 45)">
      <!-- Main Brand Name: ImagePro [STUDIO] -->
      <text x="0" y="28" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="800" font-size="30" letter-spacing="-0.5">
        <tspan fill="#ffffff">Image</tspan><tspan fill="url(#proGrad)">Pro</tspan>
      </text>

      <!-- Pill Badge: STUDIO -->
      <g transform="translate(150, 7)">
        <rect x="0" y="0" width="64" height="24" rx="6" fill="#06b6d4" fill-opacity="0.18" stroke="#06b6d4" stroke-opacity="0.45" stroke-width="1.2" />
        <text x="32" y="16.5" font-family="'JetBrains Mono', monospace, sans-serif" font-weight="800" font-size="11" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">
          STUDIO
        </text>
      </g>

      <!-- Subtitle Tagline -->
      <text x="1" y="49" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#94a3b8" letter-spacing="0.2">
        100% PRIVATE IN-BROWSER WORKSTATION
      </text>
    </g>
  </svg>
  `;

  console.log('3. Compositing official BrandLogo and typography onto preview-banner.png...');
  await sharp(BANNER_PATH)
    .composite([
      {
        input: Buffer.from(patchSvg),
        top: 0,
        left: 0
      },
      {
        input: logoResized,
        top: 36,
        left: 44
      }
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(ROOT_DIR, 'public', 'preview-banner-updated.png'));

  // Replace original preview-banner.png with updated version
  fs.copyFileSync(
    path.join(ROOT_DIR, 'public', 'preview-banner-updated.png'),
    BANNER_PATH
  );
  fs.unlinkSync(path.join(ROOT_DIR, 'public', 'preview-banner-updated.png'));

  console.log('4. Successfully updated preview-banner.png with official website logo!');
}

updateBanner().catch(console.error);
