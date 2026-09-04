import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (filePath) =>
  readFileSync(resolve(process.cwd(), filePath), "utf8");
const page = read("app/page.js");
const styles = read("app/globals.css");
const checkout = read("src/lib/client/checkout.ts");
const database = read("src/lib/db/index.ts");
const liveVerifier = read("scripts/db-verify-order-flow.ts");

for (const token of [
  "fetch(`/api/v1/stores/${storeSlug}/catalog`",
  "fetch('/api/v1/orders'",
  "'Idempotency-Key'",
  "buildAttribution(",
  "window.localStorage",
  "window.sessionStorage",
  'name="district"',
  "orderState.status === 'success'",
]) {
  if (!page.includes(token)) {
    throw new Error(`Landing checkout integration missing: ${token}`);
  }
}

if (page.includes("window.open('https://m3food.com/chuijhal-misti-moshla'")) {
  throw new Error("The landing form still redirects instead of creating an order.");
}

for (const token of [
  ".order-form-status",
  ".order-confirm-button:disabled",
  ".order-form-status.is-success",
]) {
  if (!styles.includes(token)) {
    throw new Error(`Checkout state style missing: ${token}`);
  }
}

for (const token of [
  "selectDefaultVariant",
  "getOrCreateTrackingKey",
  "utm_source",
  "utm_campaign",
  "fbclid",
  "gclid",
]) {
  if (!checkout.includes(token)) {
    throw new Error(`Reusable client checkout helper missing: ${token}`);
  }
}

if (!database.includes("closeDatabase")) {
  throw new Error("Script-safe database client cleanup is missing.");
}

for (const token of [
  "GET as getCatalog",
  "POST as postOrder",
  "batch05_live_order_flow_v2",
  "orderItems",
  "orderStatusHistory",
  "payments",
  "orderAttributions",
  "commerceEvents",
  "safe to delete after visual inspection",
]) {
  if (!liveVerifier.includes(token)) {
    throw new Error(`Live order-flow verification missing: ${token}`);
  }
}

for (const productLiteral of ["M3F-CMM-001", "813cfdc1-0553-43fd-aadf-2aa658a8d531"]) {
  if (`${checkout}\n${liveVerifier}`.includes(productLiteral)) {
    throw new Error(`Database-specific identifier leaked into reusable flow: ${productLiteral}`);
  }
}

console.log("PART C BATCH 05 LANDING CHECKOUT VERIFIED");
console.log("Live catalog-driven price and variant: present");
console.log("Idempotent order form submission: present");
console.log("Visitor, session, and campaign capture: present");
console.log("Accessible checkout states: present");
console.log("Live persisted order-graph verification: present");
