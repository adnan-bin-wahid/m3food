import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Arvi_Salek\\.gemini\\antigravity-ide\\brain\\34fb964f-c3f3-4925-b692-3095b153fb52';

async function run() {
  console.log('Launching Playwright Chromium...');
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop Viewport (1440x900)
  console.log('Testing Desktop 1440x900...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  
  const consoleErrors = [];
  desktopPage.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await desktopPage.waitForTimeout(2500);

  // Capture Full-Page Desktop Screenshot
  const desktopFullShot = path.join(ARTIFACTS_DIR, 'desktop_full_storefront.png');
  await desktopPage.screenshot({ path: desktopFullShot, fullPage: true });
  console.log('Saved desktop full-page screenshot:', desktopFullShot);

  // Capture Hero Section specifically
  const heroShot = path.join(ARTIFACTS_DIR, 'desktop_hero_section.png');
  const heroEl = await desktopPage.$('#hero');
  if (heroEl) {
    await heroEl.screenshot({ path: heroShot });
    console.log('Saved desktop hero screenshot:', heroShot);
  }

  // Capture Order Section specifically
  const orderShot = path.join(ARTIFACTS_DIR, 'desktop_order_section.png');
  const orderEl = await desktopPage.$('#order-section');
  if (orderEl) {
    await orderEl.screenshot({ path: orderShot });
    console.log('Saved desktop order screenshot:', orderShot);
  }

  await desktopContext.close();

  // 2. Mobile Viewport (iPhone 14 standard: 390x844)
  console.log('Testing Mobile 390x844...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await mobilePage.waitForTimeout(2500);

  const mobileFullShot = path.join(ARTIFACTS_DIR, 'mobile_full_storefront.png');
  await mobilePage.screenshot({ path: mobileFullShot, fullPage: true });
  console.log('Saved mobile full-page screenshot:', mobileFullShot);

  await mobileContext.close();
  await browser.close();

  console.log('\n--- PLAYWRIGHT QA RESULTS ---');
  console.log(`Console Errors detected: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors.slice(0, 5));
  } else {
    console.log('Clean console execution! No errors.');
  }
}

run().catch(err => {
  console.error('Playwright execution failed:', err);
  process.exit(1);
});
