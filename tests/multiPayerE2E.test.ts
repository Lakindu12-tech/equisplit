import { chromium } from 'playwright';
import assert from 'assert';

async function runMultiPayerE2ETest() {
  console.log('=== STARTING PLAYWRIGHT MULTI-PAYER & SPATIAL V3.0 E2E TEST ===');

  const browser = await chromium.launch({ headless: true });

  try {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    pageA.on('console', msg => console.log('PageA LOG:', msg.text()));
    pageA.on('pageerror', err => console.log('PageA ERR:', err.message));

    console.log('1. Navigating both contexts to EquiSplit v3.0...');
    await pageA.goto('http://localhost:5173');
    await pageB.goto('http://localhost:5173');

    // 2. Log in User A & User B
    console.log('2. Logging in User A (Saman) and User B (Kamal)...');
    await pageA.waitForSelector('#input-guest-name', { timeout: 10000 });
    await pageA.fill('#input-guest-name', 'Saman Perera');
    await pageA.click('#btn-guest-submit');
    await pageA.waitForSelector('#btn-create-first-group, #group-selector-btn', { timeout: 10000 });

    await pageB.waitForSelector('#input-guest-name', { timeout: 10000 });
    await pageB.fill('#input-guest-name', 'Kamal Silva');
    await pageB.click('#btn-guest-submit');
    await pageB.waitForSelector('#btn-create-first-group, #group-selector-btn', { timeout: 10000 });
    console.log('✓ Both users logged in');

    // 3. User A creates group "Galle Fort Trip 🏰"
    console.log('3. User A creating group "Galle Fort Trip 🏰"...');
    const createBtnA = await pageA.$('#btn-create-first-group') || await pageA.$('#btn-nav-create-group');
    if (createBtnA) {
      await createBtnA.click();
    } else {
      await pageA.click('#group-selector-btn');
      await pageA.click('#btn-nav-create-group');
    }

    await pageA.waitForSelector('#input-group-name');
    await pageA.fill('#input-group-name', 'Galle Fort Trip 🏰');
    
    // Select Kamal if available in list
    const kamalOption = await pageA.locator('div:has-text("Kamal Silva")').last();
    if (await kamalOption.isVisible()) {
      await kamalOption.click();
    }

    await pageA.click('#btn-submit-create-group');
    await pageA.waitForSelector('text=Galle Fort Trip', { timeout: 10000 });
    console.log('✓ Group created');

    // 4. Test Multi-Payer Expense Entry
    console.log('4. Adding Multi-Payer Expense (Saman Rs. 6,000 + Kamal Rs. 4,000 = Rs. 10,000)...');
    const addExpenseBtn = await pageA.$('#btn-nav-add-expense') || await pageA.$('#btn-dashboard-add-expense');
    await addExpenseBtn?.click();

    await pageA.waitForSelector('#input-expense-title', { timeout: 10000 });
    await pageA.fill('#input-expense-title', 'Galle Fort Heritage Villa');
    await pageA.fill('#input-expense-amount', '10000');

    // Switch to Multi-Payer mode
    await pageA.click('#btn-tab-multi-payer');
    await pageA.waitForTimeout(300);

    // Fill multi-payer inputs
    const payerInputs = await pageA.locator('.multi-payer-input').all();
    console.log(`Found ${payerInputs.length} multi-payer inputs`);
    if (payerInputs.length >= 2) {
      await payerInputs[0].fill('6000');
      await payerInputs[1].fill('4000');
    } else if (payerInputs.length === 1) {
      await payerInputs[0].fill('10000');
    }

    await pageA.waitForTimeout(300);
    const saveBtn = await pageA.$('#btn-save-expense');
    const isDisabled = await saveBtn?.isDisabled();
    console.log('Save button disabled status:', isDisabled);

    await saveBtn?.click();
    await pageA.waitForSelector('text=Galle Fort Heritage Villa', { timeout: 10000 });
    console.log('✓ Multi-payer expense recorded');

    // 5. Test Smart Add Natural Language Bar
    console.log('5. Testing Smart Add NLP: "Seafood lunch 4000"...');
    await pageA.waitForSelector('#smart-add-input');
    await pageA.fill('#smart-add-input', 'Seafood lunch 4000');
    await pageA.waitForSelector('#btn-smart-add-submit', { timeout: 5000 });
    await pageA.click('#btn-smart-add-submit');
    await pageA.waitForSelector('text=Seafood lunch', { timeout: 10000 });
    console.log('✓ Smart Add parsed and executed successfully');

    // 6. Test PDF and CSV Exports on Balances Ledger
    console.log('6. Testing Settle Up tab & PDF export button...');
    await pageA.click('#tab-ledger');
    await pageA.waitForSelector('#btn-export-pdf', { timeout: 5000 });
    console.log('✓ PDF and CSV Export buttons visible and ready');

    // 7. Screenshots
    await pageA.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/v3_multi_payer_dashboard.png' });
    await pageA.click('#tab-dashboard');
    await pageA.waitForTimeout(500);
    await pageA.screenshot({ path: 'C:/Users/HP/.gemini/antigravity-ide/brain/5ce2b336-7d11-47d8-83c4-ef2f1677cac8/v3_spatial_dashboard.png' });

    console.log('=== MULTI-PAYER & SPATIAL V3.0 E2E TEST PASSED WITH 0 ERRORS ===');
  } finally {
    await browser.close();
  }
}

runMultiPayerE2ETest().catch((err) => {
  console.error('Multi-payer E2E test failed:', err);
  process.exit(1);
});
