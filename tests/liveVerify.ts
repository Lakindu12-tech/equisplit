import { chromium } from 'playwright';

async function verifyLive() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    console.log('Navigating to live production URL: https://new-project-f9748.web.app ...');
    await page.goto('https://new-project-f9748.web.app');
    await page.waitForSelector('#input-guest-name', { timeout: 15000 });
    console.log('✓ Auth screen rendered');
    await page.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/live_auth_screen.png' });

    // Enter as guest
    await page.fill('#input-guest-name', 'Saman Perera');
    await page.click('#btn-guest-submit');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/live_dashboard_screen.png' });
    console.log('✓ Dashboard screen rendered');
  } finally {
    await browser.close();
  }
}

verifyLive().catch(console.error);
