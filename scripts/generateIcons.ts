import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const iconsDir = path.resolve('public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgContent = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#060e20" />
        <stop offset="100%" stop-color="#0b172a" />
      </linearGradient>
      <linearGradient id="emerald" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.2"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#10b981" flood-opacity="0.4"/>
      </filter>
    </defs>
    
    <!-- Background Container -->
    <rect width="512" height="512" rx="112" fill="url(#bg)"/>
    <rect width="508" height="508" x="2" y="2" rx="110" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="4"/>

    <!-- Subtle Ambient Glow -->
    <circle cx="256" cy="256" r="160" fill="url(#glow)" filter="blur(40px)" />

    <!-- 3D Stacked Layers Symbol -->
    <g transform="translate(106, 116)" filter="url(#shadow)">
      <!-- Layer 3 (Bottom) -->
      <path d="M150 170 L280 235 L150 300 L20 235 Z" fill="none" stroke="#059669" stroke-width="20" stroke-linejoin="round" stroke-linecap="round" opacity="0.6"/>
      <!-- Layer 2 (Middle) -->
      <path d="M150 100 L280 165 L150 230 L20 165 Z" fill="none" stroke="#10b981" stroke-width="22" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>
      <!-- Layer 1 (Top Hero) -->
      <path d="M150 30 L280 95 L150 160 L20 95 Z" fill="url(#emerald)" stroke="#6ee7b7" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
    </g>
  </svg>
  `;

  // Save SVG
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent.trim());
  console.log('✓ Saved public/icons/icon.svg');

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh;">
          ${svgContent}
        </body>
      </html>
    `);

    // Render 192x192
    await page.setViewportSize({ width: 192, height: 192 });
    await page.screenshot({ path: path.join(iconsDir, 'icon-192x192.png'), omitBackground: false });
    await page.screenshot({ path: path.join(iconsDir, 'icon-maskable-192x192.png'), omitBackground: false });
    console.log('✓ Saved 192x192 icons');

    // Render 512x512
    await page.setViewportSize({ width: 512, height: 512 });
    await page.screenshot({ path: path.join(iconsDir, 'icon-512x512.png'), omitBackground: false });
    await page.screenshot({ path: path.join(iconsDir, 'icon-maskable-512x512.png'), omitBackground: false });
    console.log('✓ Saved 512x512 icons');

    // Render apple-touch-icon
    await page.setViewportSize({ width: 180, height: 180 });
    await page.screenshot({ path: path.join(iconsDir, 'apple-touch-icon.png'), omitBackground: false });
    console.log('✓ Saved apple-touch-icon.png');
  } finally {
    await browser.close();
  }
}

generateIcons().catch(console.error);
