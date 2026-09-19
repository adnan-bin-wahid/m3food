import { chromium } from '@playwright/test';
import path from 'node:path';

const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN || '';
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'C:/Users/Arvi_Salek/.gemini/antigravity-ide/brain/42815651-5ad8-4eeb-a5bf-77fb807e9a06';

async function main() {
  const browser = await chromium.launch();

  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await desktopContext.addCookies([
    {
      name: 'niyamah_attires_admin_session',
      value: SESSION_TOKEN,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    },
  ]);

  const desktopPage = await desktopContext.newPage();

  console.log('Capturing Desktop Customers...');
  await desktopPage.goto('http://localhost:3000/admin/customers', { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_customers.png'), fullPage: false });

  console.log('Capturing Desktop Payments...');
  await desktopPage.goto('http://localhost:3000/admin/payments', { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_payments.png'), fullPage: false });

  console.log('Capturing Desktop Financials...');
  await desktopPage.goto('http://localhost:3000/admin/financials', { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_desktop_financials.png'), fullPage: false });

  await desktopContext.close();

  // Mobile context
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  });
  await mobileContext.addCookies([
    {
      name: 'niyamah_attires_admin_session',
      value: SESSION_TOKEN,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    },
  ]);

  const mobilePage = await mobileContext.newPage();

  console.log('Capturing Mobile Customers...');
  await mobilePage.goto('http://localhost:3000/admin/customers', { waitUntil: 'networkidle' });
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_mobile_customers.png'), fullPage: false });

  console.log('Capturing Mobile Payments...');
  await mobilePage.goto('http://localhost:3000/admin/payments', { waitUntil: 'networkidle' });
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'qa_mobile_payments.png'), fullPage: false });

  await mobileContext.close();
  await browser.close();

  console.log('All QA screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
