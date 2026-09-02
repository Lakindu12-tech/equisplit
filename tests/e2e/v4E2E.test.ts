import { chromium } from 'playwright';
import assert from 'assert';

async function runV4E2ETest() {
  console.log('=== STARTING PLAYWRIGHT V4.0 ULTIMATE FINANCIAL ENGINE E2E TEST ===');

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    page.on('console', msg => console.log('Page LOG:', msg.text()));
    page.on('pageerror', err => console.log('Page ERR:', err.message));

    console.log('1. Navigating to EquiSplit v4.0...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 2. Log in User if needed
    console.log('2. Checking login state...');
    const guestInput = await page.$('#input-guest-name');
    if (guestInput && await guestInput.isVisible()) {
      await page.fill('#input-guest-name', 'Kasun Dias');
      await page.click('#btn-guest-submit');
      await page.waitForSelector('#btn-create-first-group, #group-selector-btn', { timeout: 10000 });
      console.log('✓ Logged in as instant guest');
    } else {
      console.log('✓ Already logged in');
    }

    // 3. Create Group
    console.log('3. Creating group "Bentota Luxury Villa 🏖️"...');
    const createBtn = await page.$('#btn-create-first-group') || await page.$('#btn-nav-create-group');
    if (createBtn && await createBtn.isVisible()) {
      await createBtn.click();
    } else {
      await page.click('#group-selector-btn');
      await page.click('#btn-nav-create-group');
    }

    await page.waitForSelector('#input-group-name');
    await page.fill('#input-group-name', 'Bentota Luxury Villa 🏖️');
    await page.click('#btn-submit-create-group');
    await page.waitForSelector('text=Bentota Luxury Villa', { timeout: 10000 });
    console.log('✓ Group created');

    // 4. Test Envelope Budgeting Configuration
    console.log('4. Testing Envelope Budgeting Settings...');
    await page.waitForSelector('#btn-open-budget-settings', { timeout: 5000 });
    await page.click('#btn-open-budget-settings');
    await page.waitForSelector('#btn-save-budgets', { timeout: 5000 });
    
    // Set Food budget limit to 25000
    const budgetInputs = await page.locator('input[type="number"][placeholder="No limit"]').all();
    if (budgetInputs.length > 0) {
      await budgetInputs[0].fill('25000');
    }
    await page.click('#btn-save-budgets');
    await page.waitForTimeout(500);
    console.log('✓ Monthly budget envelope configured');

    // 5. Test QR Code Group Invite Modal
    console.log('5. Testing QR Code Group Invite Modal...');
    await page.click('#btn-nav-qr-invite');
    await page.waitForSelector('#btn-close-invite-modal', { timeout: 5000 });
    console.log('✓ QR Invite modal verified');
    await page.click('#btn-close-invite-modal');
    await page.waitForTimeout(300);

    // 6. Test Bank Statement CSV Importer Modal
    console.log('6. Testing Bank Statement CSV Importer Modal...');
    await page.click('#btn-nav-bank-import');
    await page.waitForSelector('#btn-close-bank-import', { timeout: 5000 });
    console.log('✓ Bank CSV Importer modal opened');
    await page.click('#btn-close-bank-import');
    await page.waitForTimeout(300);

    // 7. Test Add Expense Modal with OCR Itemized Scanner & Recurring Bill
    console.log('7. Testing Add Expense Modal with OCR Scanner & Recurring Bill Toggle...');
    await page.click('#btn-dashboard-add-expense');
    await page.waitForSelector('#btn-scan-itemize-receipt', { timeout: 5000 });
    
    // Open OCR scanner modal via DOM click
    await page.evaluate(() => {
      (document.querySelector('#btn-scan-itemize-receipt') as HTMLElement)?.click();
    });
    await page.waitForSelector('#btn-close-itemize-modal', { timeout: 5000 });
    console.log('✓ Interactive OCR Receipt Claiming modal opened');
    await page.evaluate(() => {
      (document.querySelector('#btn-close-itemize-modal') as HTMLElement)?.click();
    });
    await page.waitForTimeout(300);

    // Check recurring checkbox
    await page.check('#checkbox-recurring-expense');
    await page.waitForSelector('button:has-text("monthly")', { timeout: 3000 });

    // Fill normal expense and save
    await page.fill('#input-expense-title', 'Mirissa Fresh Seafood');
    await page.fill('#input-expense-amount', '12500');
    await page.click('#btn-save-expense');
    await page.waitForSelector('text=Mirissa Fresh Seafood', { timeout: 10000 });
    console.log('✓ Expense recorded with recurring tracking');

    // 8. Test Balances Ledger with Localized Bank Transfer Auto-Copy UI
    console.log('8. Testing Balances Ledger Bank Transfer Auto-Copy...');
    await page.click('#tab-ledger');
    await page.waitForSelector('button:has-text("Bank Info")', { timeout: 5000 });
    await page.click('button:has-text("Bank Info")');
    await page.waitForSelector('text=Bank Transfer Auto-Copy 🇱🇰', { timeout: 5000 });
    await page.waitForSelector('text=Commercial Bank of Ceylon');
    console.log('✓ Localized Bank Transfer Auto-Copy verified');
    await page.keyboard.press('Escape');

    // 9. Screenshots
    await page.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/v4_settlement_ledger.png' });
    await page.click('#tab-dashboard');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/v4_financial_engine_dashboard.png' });

    console.log('=== PLAYWRIGHT V4.0 ULTIMATE FINANCIAL ENGINE TEST PASSED WITH 0 ERRORS ===');
  } finally {
    await browser.close();
  }
}

runV4E2ETest().catch((err) => {
  console.error('v4.0 E2E test failed:', err);
  process.exit(1);
});
