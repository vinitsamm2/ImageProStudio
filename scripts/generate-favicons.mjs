import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Master 512x512 SVG reflecting BrandLogo.tsx identically
const svgMaster512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <!-- Background Gradient: from-cyan-500 via-teal-500 to-indigo-500 (45deg / to top right) -->
    <linearGradient id="wandBgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="48%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>

    <!-- Subtle Soft Drop Shadow -->
    <filter id="wandShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#06b6d4" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Base Rounded Squircle with Shadow (identical to rounded-2xl in BrandLogo) -->
  <rect x="32" y="32" width="448" height="448" rx="112" fill="url(#wandBgGrad)" filter="url(#wandShadow)" />
  <rect x="32" y="32" width="448" height="448" rx="112" stroke="#ffffff" stroke-width="6" stroke-opacity="0.25" />

  <!-- Lucide Wand2 (WandSparkles) Vector Emblem Centered -->
  <g transform="translate(126, 126) scale(10.8333)" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <!-- Main Wand Shaft & Head -->
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
    <!-- Wand Tip Collar -->
    <path d="m14 7 3 3" />
    <!-- Ambient Magic Sparkles -->
    <path d="M5 6v4" />
    <path d="M19 14v4" />
    <path d="M10 2v2" />
    <path d="M7 8H3" />
    <path d="M21 16h-4" />
    <path d="M11 3H9" />
  </g>

  <!-- Top-Right Cyan Glowing Ping Indicator (from BrandLogo.tsx) -->
  <circle cx="448" cy="64" r="32" fill="#22d3ee" opacity="0.3" />
  <circle cx="448" cy="64" r="22" fill="#22d3ee" opacity="0.6" />
  <circle cx="448" cy="64" r="15" fill="#22d3ee" stroke="#ffffff" stroke-width="4" />
  <circle cx="448" cy="64" r="6" fill="#ffffff" />
</svg>
`;

// Optimized SVG for small favicon tabs (clean, razor sharp lines at 16/32/64px)
const svgFavicon64 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
  <defs>
    <linearGradient id="favBgGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4" />
      <stop offset="48%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
  </defs>

  <!-- Squircle Emblem -->
  <rect x="3" y="3" width="58" height="58" rx="15" fill="url(#favBgGrad)" />
  <rect x="3" y="3" width="58" height="58" rx="15" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.3" />

  <!-- Lucide Wand2 Centered -->
  <g transform="translate(15, 15) scale(1.4166)" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" />
    <path d="m14 7 3 3" />
    <path d="M5 6v4" />
    <path d="M19 14v4" />
    <path d="M10 2v2" />
    <path d="M7 8H3" />
    <path d="M21 16h-4" />
    <path d="M11 3H9" />
  </g>

  <!-- Glowing Cyan Dot at Top-Right Corner -->
  <circle cx="56" cy="8" r="5" fill="#22d3ee" opacity="0.4" />
  <circle cx="56" cy="8" r="3.2" fill="#22d3ee" stroke="#ffffff" stroke-width="1" />
  <circle cx="56" cy="8" r="1.2" fill="#ffffff" />
</svg>
`;

async function main() {
  console.log('1. Writing master logo.svg and favicon.svg...');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'logo.svg'), svgMaster512, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), svgFavicon64, 'utf8');

  console.log('2. Generating PNG raster assets at all standard favicon sizes...');
  const svgBuffer = Buffer.from(svgMaster512);

  const pngSizes = [
    { name: 'favicon-16x16.png', size: 16, useFaviconSvg: true },
    { name: 'favicon-32x32.png', size: 32, useFaviconSvg: true },
    { name: 'favicon-48x48.png', size: 48, useFaviconSvg: false },
    { name: 'favicon-96x96.png', size: 96, useFaviconSvg: false },
    { name: 'favicon-192x192.png', size: 192, useFaviconSvg: false },
    { name: 'apple-touch-icon.png', size: 180, useFaviconSvg: false },
    { name: 'logo.png', size: 512, useFaviconSvg: false }
  ];

  for (const { name, size, useFaviconSvg } of pngSizes) {
    const srcSvg = useFaviconSvg ? Buffer.from(svgFavicon64) : svgBuffer;
    await sharp(srcSvg)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC_DIR, name));
    console.log(`   ✓ Created ${name} (${size}x${size})`);
  }

  console.log('3. Generating multi-resolution favicon.ico (16, 32, 48)...');
  const icoBuffer = await pngToIco([
    path.join(PUBLIC_DIR, 'favicon-16x16.png'),
    path.join(PUBLIC_DIR, 'favicon-32x32.png'),
    path.join(PUBLIC_DIR, 'favicon-48x48.png')
  ]);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log('   ✓ Created favicon.ico successfully');

  console.log('\nAll favicon and logo branding assets updated cleanly to match BrandLogo.tsx!');
}

main().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
