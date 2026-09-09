import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function walk(relativeDir) {
  const absolute = path.join(root, relativeDir);
  const output = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) output.push(...walk(relative));
    else output.push(relative);
  }
  return output;
}

const page = read("app/page.js");
requireCondition(
  page.includes("getPublicStoreSlug"),
  "Landing page must resolve its store through getPublicStoreSlug().",
);
requireCondition(
  !/const\s+storeSlug\s*=\s*['"]m3food['"]/.test(page),
  "Landing page still hardcodes the M3Food runtime store slug.",
);

const envExample = read(".env.example");
requireCondition(
  /^NEXT_PUBLIC_STORE_SLUG=(?:m3food|niyamah-attires)$/m.test(envExample),
  ".env.example must document NEXT_PUBLIC_STORE_SLUG.",
);
requireCondition(
  /^DEFAULT_STORE_SLUG=(?:m3food|niyamah-attires)$/m.test(envExample),
  ".env.example must document DEFAULT_STORE_SLUG.",
);

const packageJson = JSON.parse(read("package.json"));
requireCondition(packageJson.scripts?.["db:bootstrap"], "Generic db:bootstrap script is missing.");
requireCondition(packageJson.scripts?.["db:verify:store"], "Generic db:verify:store script is missing.");
requireCondition(packageJson.scripts?.["verify:client-config"], "Client config verifier script is missing.");
requireCondition(packageJson.scripts?.["verify:part-l"], "Part L verifier script is missing.");
requireCondition(
  packageJson.scripts?.check?.includes("verify:part-l"),
  "Full check must include verify:part-l.",
);

const clientTemplate = JSON.parse(read("config/stores/client-template.json"));
requireCondition(
  clientTemplate.store?.slug === "client-store",
  "Client template must expose a neutral client-store slug.",
);
requireCondition(
  clientTemplate.store?.status === "INACTIVE",
  "Client template must fail closed with an inactive store until edited.",
);
requireCondition(
  clientTemplate.products?.[0]?.status === "DRAFT",
  "Client template product must remain draft until edited.",
);

const runtimeSourceFiles = walk("src/lib").filter(
  (file) =>
    /\.(?:ts|js|tsx|jsx)$/.test(file) &&
    !file.includes(".test.") &&
    !file.endsWith("store-runtime.ts"),
);
const hardcodedRuntime = runtimeSourceFiles.filter((file) => /\bm3food\b/i.test(read(file)));
requireCondition(
  hardcodedRuntime.length === 0,
  `Shared runtime code still contains M3Food-specific identity: ${hardcodedRuntime.join(", ")}`,
);

requireCondition(
  read("docs/template-frontend-contract.md").includes("data-track-cta"),
  "Frontend tracking contract is missing stable CTA requirements.",
);

console.log("PART L TEMPLATE GENERALIZATION VERIFIED");
console.log("Public storefront identity is environment-driven: present");
console.log("Generic database bootstrap/verification entry points: present");
console.log("Fail-closed neutral client config template: present");
console.log("Shared runtime source is free of M3Food store identity: verified");
console.log("Reusable frontend tracking contract and onboarding docs: present");
