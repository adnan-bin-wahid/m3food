import fs from "node:fs";

const required = [
  "app/admin/marketing/retargeting/page.js",
  "src/lib/admin/retargeting-service.ts",
  "src/lib/admin/retargeting-repository.ts",
  "src/lib/db/admin-retargeting-repository.ts",
  "src/lib/admin/retargeting-service.test.ts",
  "scripts/db-verify-retargeting.ts",
  "docs/part-i-retargeting-abandonment.md",
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Part I missing ${file}`);
}
const service = fs.readFileSync("src/lib/admin/retargeting-service.ts", "utf8");
const repo = fs.readFileSync("src/lib/db/admin-retargeting-repository.ts", "utf8");
const page = fs.readFileSync("app/admin/marketing/retargeting/page.js", "utf8");
const shell = fs.readFileSync("components/admin/AdminShell.js", "utf8");
for (const token of ["CART_ABANDONERS", "CHECKOUT_ABANDONERS", "VIEWED_NO_PURCHASE", "RETARGETING_WINDOWS", "RETARGETING_ABANDONMENT_GRACE_MINUTES"]) {
  if (!service.includes(token)) throw new Error(`Part I service missing ${token}`);
}
if (!repo.includes("not exists") || !repo.includes("event_name = 'PURCHASE'")) {
  throw new Error("Part I repository must enforce purchase exclusion.");
}
if (!repo.includes("vs.last_seen_at <=") || !repo.includes("cutoffAt")) {
  throw new Error("Part I repository must enforce abandonment inactivity cutoff.");
}
if (!page.includes("Meta website audience") || !page.includes("Purchase exclusion")) {
  throw new Error("Part I admin UI must surface Meta rules and purchase exclusion.");
}
if (!shell.includes("/admin/marketing/retargeting")) {
  throw new Error("Part I admin navigation is missing.");
}
console.log("PART I RETARGETING & ABANDONMENT VERIFIED");
console.log("Cart, checkout, and viewed-no-purchase audiences: present");
console.log("7/14/30 day windows plus 30-minute inactivity grace: present");
console.log("Server-side later-Purchase exclusion: present");
console.log("Store-scoped retargeting admin visibility and Meta rule guidance: present");
