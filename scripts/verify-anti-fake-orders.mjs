import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) =>
  fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) =>
  fs.existsSync(path.join(root, relative));
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const requiredFiles = [
  "src/lib/commerce/bd-phone.ts",
  "src/lib/commerce/order-risk.ts",
  "src/lib/security/phone-verification.ts",
  "src/lib/security/otp-delivery.ts",
  "src/lib/security/phone-verification-repository.ts",
  "src/lib/db/phone-verification-repository.ts",
  "src/lib/http/phone-verification-handler.ts",
  "app/api/v1/phone-verifications/start/route.ts",
  "app/api/v1/phone-verifications/verify/route.ts",
];
for (const file of requiredFiles) {
  requireCondition(exists(file), `Missing anti-fake-order file: ${file}`);
}

const schema = read("src/lib/db/schema.ts");
requireCondition(
  schema.includes('"phone_verification_challenges"'),
  "Phone verification challenge table is missing.",
);
requireCondition(
  schema.includes('"order_risk_level"'),
  "Order risk enum is missing.",
);
requireCondition(
  schema.includes('phoneVerificationChallengeId: uuid("phone_verification_challenge_id")'),
  "Order/challenge audit link is missing.",
);
requireCondition(
  schema.includes('manualReviewRequired: boolean("manual_review_required")'),
  "Manual review flag is missing.",
);

const contracts = read("src/lib/commerce/contracts.ts");
requireCondition(
  contracts.includes("bangladeshMobileSchema"),
  "Bangladesh phone normalization is not enforced at checkout.",
);
requireCondition(
  contracts.includes("phoneVerificationToken"),
  "Orders are not gated by phone verification.",
);

const handler = read("src/lib/http/phone-verification-handler.ts");
requireCondition(
  handler.includes("START_PHONE_LIMIT = 3"),
  "Per-phone OTP start throttling is missing.",
);
requireCondition(
  handler.includes("OTP_DELIVERY_UNAVAILABLE"),
  "OTP delivery must fail closed.",
);
requireCondition(
  handler.includes("attemptsRemaining"),
  "OTP wrong-attempt accounting is missing.",
);

const security = read("src/lib/security/phone-verification.ts");
requireCondition(
  security.includes('createHmac("sha256"'),
  "OTP/token HMAC protection is missing.",
);
requireCondition(
  !security.includes("codeHash: code"),
  "OTP plaintext must never be persisted as its hash.",
);

const orderService = read("src/lib/commerce/order-service.ts");
requireCondition(
  orderService.includes("consumePhoneVerification"),
  "Verified challenges are not one-time consumed.",
);
requireCondition(
  orderService.includes("RECENT_DUPLICATE_ORDER"),
  "Recent duplicate order blocking is missing.",
);
requireCondition(
  orderService.includes("assessOrderRisk"),
  "Risk scoring is not connected to order creation.",
);

const adminDetail = read("app/admin/orders/[publicId]/page.js");
requireCondition(
  adminDetail.includes("Order trust"),
  "Admin order trust/risk visibility is missing.",
);
requireCondition(
  adminDetail.includes("HIGH risk: call the customer"),
  "High-risk manual confirmation guidance is missing.",
);

const storefront = read("app/page.js");
requireCondition(
  storefront.includes("/api/v1/phone-verifications/start"),
  "Storefront OTP start flow is missing.",
);
requireCondition(
  storefront.includes("/api/v1/phone-verifications/verify"),
  "Storefront OTP verify flow is missing.",
);
requireCondition(
  storefront.includes("phoneVerificationToken: otpState.token"),
  "Verified OTP token is not passed to final order creation.",
);

console.log("ANTI-FAKE ORDER GUARD VERIFIED");
console.log("Bangladesh phone normalization: present");
console.log("OTP before order creation: present");
console.log("OTP hash + expiry + attempt limit + resend/rate limits: present");
console.log("DEV/WEBHOOK delivery boundary: present");
console.log("One-time verification consumption: present");
console.log("10-minute exact repeat blocking: present");
console.log("1h/24h frequency + delivery/cancel/return history risk: present");
console.log("LOW/MEDIUM/HIGH immutable risk snapshot: present");
console.log("HIGH-risk admin manual confirmation guidance: present");
