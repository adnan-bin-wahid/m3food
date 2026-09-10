import { chromium } from '@playwright/test';
import path from 'path';

const outDir = 'C:\\Users\\Arvi_Salek\\.gemini\\antigravity-ide\\brain\\34fb964f-c3f3-4925-b692-3095b153fb52';

async function main() {
  const browser = await chromium.launch({ headless: true });

  const sections = [
    { id: '#why-niyamah', name: 'section_why_niyamah' },
    { id: '#story', name: 'section_brand_story' },
    { id: '#collections', name: 'section_featured_collections' },
    { id: '#fabric-guide', name: 'section_fabric_guide' },
    { id: '#fragrance-notes', name: 'section_attar_notes' },
    { id: '#tulip-package', name: 'section_tulip_showcase' },
    { id: '#craftsmanship', name: 'section_craftsmanship' },
    { id: '#catalog', name: 'section_product_catalog' },
    { id: '#reviews', name: 'section_reviews' },
    { id: '#trust', name: 'section_trust_pillars' },
    { id: '#order-section', name: 'section_order' },
    { id: '#faq', name: 'section_faq' }
  ];

  async function waitForImages(page, selector) {
    await page.evaluate(async (sel) => {
      const container = document.querySelector(sel);
      if (!container) return;
      const imgs = Array.from(container.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    }, selector);
  }

  // Desktop run
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  await desktopContext.addInitScript(() => {
    window.localStorage.setItem('commerce_analytics_consent', JSON.stringify({ preference: 'accepted', policyVersion: '2026-09-07.4' }));
  });

  const page = await desktopContext.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Capture Hero
  const heroEl = await page.$('.nh-hero');
  if (heroEl) {
    await heroEl.screenshot({ path: path.join(outDir, 'hero_cinematic_desktop.png') });
    console.log('Captured hero_cinematic_desktop.png');
  }

  for (const sec of sections) {
    const el = await page.$(sec.id);
    if (el) {
      await page.evaluate((sel) => {
        const target = document.querySelector(sel);
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, sec.id);
      await page.waitForTimeout(300);
      await page.evaluate((sel) => {
        const target = document.querySelector(sel);
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      }, sec.id);
      await page.waitForTimeout(300);
      await page.evaluate((sel) => {
        const target = document.querySelector(sel);
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, sec.id);
      await waitForImages(page, sec.id);
      await page.waitForTimeout(400);
      await el.screenshot({ path: path.join(outDir, `${sec.name}_desktop.png`) });
      console.log(`Captured ${sec.name}_desktop.png`);
    } else {
      console.log(`Element ${sec.id} not found on desktop`);
    }
  }

  // Mobile run (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
  });
  await mobileContext.addInitScript(() => {
    window.localStorage.setItem('commerce_analytics_consent', JSON.stringify({ preference: 'accepted', policyVersion: '2026-09-07.4' }));
  });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(2000);

  const mobileHeroEl = await mobilePage.$('.nh-hero');
  if (mobileHeroEl) {
    await mobileHeroEl.screenshot({ path: path.join(outDir, 'hero_cinematic_mobile.png') });
    console.log('Captured hero_cinematic_mobile.png');
  }

  for (const sec of sections) {
    const el = await mobilePage.$(sec.id);
    if (el) {
      await mobilePage.evaluate((sel) => {
        const target = document.querySelector(sel);
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, sec.id);
      await mobilePage.waitForTimeout(300);
      await mobilePage.evaluate((sel) => {
        const target = document.querySelector(sel);
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      }, sec.id);
      await mobilePage.waitForTimeout(300);
      await mobilePage.evaluate((sel) => {
        const target = document.querySelector(sel);
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, sec.id);
      await waitForImages(mobilePage, sec.id);
      await mobilePage.waitForTimeout(400);
      await el.screenshot({ path: path.join(outDir, `${sec.name}_mobile.png`) });
      console.log(`Captured ${sec.name}_mobile.png`);
    } else {
      console.log(`Element ${sec.id} not found on mobile`);
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

main().catch(console.error);
