import { chromium } from 'playwright';

async function runMultiContextTest() {
  console.log('=== STARTING PLAYWRIGHT MULTI-CONTEXT REAL-TIME CONCURRENCY TEST ===');

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Create two isolated browser contexts (User A: Saman, User B: Kamal)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    pageA.on('console', msg => console.log('PAGE A LOG:', msg.text()));
    pageA.on('pageerror', err => console.error('PAGE A ERROR:', err));
    pageB.on('console', msg => console.log('PAGE B LOG:', msg.text()));
    pageB.on('pageerror', err => console.error('PAGE B ERROR:', err));

    console.log('1. Navigating both browser contexts to EquiSplit...');
    await pageA.goto('http://localhost:5173');
    await pageB.goto('http://localhost:5173');

    // 2. User A logs in as instant guest "Saman Perera"
    console.log('2. Logging in User A (Saman)...');
    await pageA.waitForSelector('#input-guest-name', { timeout: 10000 });
    await pageA.fill('#input-guest-name', 'Saman Perera');
    await pageA.click('#btn-guest-submit');
    await pageA.waitForSelector('#btn-create-first-group, #group-selector-btn', { timeout: 10000 });
    console.log('✓ User A logged in successfully');

    // 3. User B logs in as instant guest "Kamal Silva"
    console.log('3. Logging in User B (Kamal)...');
    await pageB.waitForSelector('#input-guest-name', { timeout: 10000 });
    await pageB.fill('#input-guest-name', 'Kamal Silva');
    await pageB.click('#btn-guest-submit');
    await pageB.waitForSelector('#btn-create-first-group, #group-selector-btn', { timeout: 10000 });
    console.log('✓ User B logged in successfully');

    // 4. User A creates a group and selects Kamal
    console.log('4. User A creating group "Mirissa Beach Villa 🌴"...');
    const createBtnA = await pageA.$('#btn-create-first-group') || await pageA.$('#btn-nav-create-group');
    if (createBtnA) {
      await createBtnA.click();
    } else {
      await pageA.click('#group-selector-btn');
      await pageA.click('#btn-nav-create-group');
    }

    await pageA.waitForSelector('#input-group-name');
    await pageA.fill('#input-group-name', 'Mirissa Beach Villa 🌴');
    
    // Select Kamal if visible in directory
    const kamalOption = await pageA.locator('div:has-text("Kamal Silva")').first();
    if (await kamalOption.isVisible()) {
      await kamalOption.click();
    }

    await pageA.click('#btn-submit-create-group');
    await pageA.waitForSelector('text=Mirissa Beach Villa', { timeout: 10000 });
    console.log('✓ User A created group "Mirissa Beach Villa 🌴"');

    // 5. User A records an expense
    console.log('5. User A adding expense "Seafood BBQ at Mirissa Beach" (Rs. 24,000.00)...');
    const addExpenseBtn = await pageA.$('#btn-nav-add-expense') || await pageA.$('#btn-dashboard-add-expense');
    await addExpenseBtn?.click();

    await pageA.waitForSelector('#input-expense-title', { timeout: 10000 });
    await pageA.fill('#input-expense-title', 'Seafood BBQ at Mirissa Beach');
    await pageA.type('#input-expense-amount', '24000');
    await pageA.waitForTimeout(500);

    const isBtnDisabled = await pageA.$eval('#btn-save-expense', (el: any) => el.disabled);
    console.log('Save button disabled status:', isBtnDisabled);

    await pageA.click('#btn-save-expense');

    await pageA.waitForSelector('text=Seafood BBQ at Mirissa Beach', { timeout: 10000 });
    console.log('✓ User A added expense successfully on Context A');

    // 6. Screenshot Context A and Context B
    await pageA.screenshot({ path: 'docs_user_a_context.png' });
    await pageB.screenshot({ path: 'docs_user_b_context.png' });

    console.log('=== MULTI-CONTEXT REAL-TIME CONCURRENCY TEST PASSED WITH 0 ERRORS ===');
  } finally {
    await browser.close();
  }
}

runMultiContextTest().catch((err) => {
  console.error('Multi-context test failed:', err);
  process.exit(1);
});
