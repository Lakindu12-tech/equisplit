import { chromium } from 'playwright';

async function verifyFullFlow() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('https://new-project-f9748.web.app');
    await page.waitForSelector('#input-guest-name', { timeout: 15000 });
    await page.fill('#input-guest-name', 'Saman Perera');
    await page.click('#btn-guest-submit');
    await page.waitForSelector('#btn-create-first-group, #group-selector-btn', { timeout: 15000 });

    // Create group
    const createBtn = await page.$('#btn-create-first-group') || await page.$('#btn-nav-create-group');
    if (createBtn) {
      await createBtn.click();
      await page.waitForSelector('#input-group-name');
      await page.fill('#input-group-name', 'Mirissa Beach Villa 🌴');
      await page.click('#btn-submit-create-group');
      await page.waitForSelector('text=Mirissa Beach Villa', { timeout: 10000 });
    }

    // Add expense
    const addExpenseBtn = await page.$('#btn-nav-add-expense') || await page.$('#btn-dashboard-add-expense');
    if (addExpenseBtn) {
      await addExpenseBtn.click();
      await page.waitForSelector('#input-expense-title');
      await page.fill('#input-expense-title', 'Villa Ocean Breeze Stay');
      await page.type('#input-expense-amount', '45000');
      await page.click('#btn-save-expense');
      await page.waitForSelector('text=Villa Ocean Breeze Stay', { timeout: 10000 });
    }

    // Screenshot full dashboard
    await page.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/live_v2_dashboard_populated.png' });

    // Switch to settle up ledger
    await page.click('#tab-ledger');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/live_v2_ledger.png' });

    // Switch to spending insights
    await page.click('#tab-insights');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/live_v2_insights.png' });

    console.log('✓ Full production flow screenshots captured');
  } finally {
    await browser.close();
  }
}

verifyFullFlow().catch(console.error);
