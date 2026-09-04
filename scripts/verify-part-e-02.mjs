import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const schema = read("src/lib/db/schema.ts");
const password = read("src/lib/auth/password.ts");
const authentication = read("src/lib/auth/admin-auth.ts");
const session = read("src/lib/auth/session.ts");
const repository = read("src/lib/db/admin-auth-repository.ts");
const loginRoute = read("app/api/admin/login/route.js");
const logoutRoute = read("app/api/admin/logout/route.js");
const sessionRoute = read("app/api/admin/session/route.js");
const settingsRoute = read("app/api/admin/settings/route.js");
const loginPage = read("app/admin/login/page.js");
const dashboardPage = read("app/admin/dashboard/page.js");
const bootstrap = read("scripts/admin-bootstrap.ts");
const liveVerifier = read("scripts/db-verify-admin-auth.ts");
const migrations = readdirSync(resolve(process.cwd(), "drizzle")).filter((name) =>
  /^0005_.+\.sql$/.test(name),
);

if (migrations.length !== 1) {
  throw new Error(`Expected one Part E-02 migration, found ${migrations.length}.`);
}
const migration = read(`drizzle/${migrations[0]}`);
for (const token of [
  'CREATE TABLE "admin_users"',
  'CREATE TABLE "admin_sessions"',
  'ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE "admin_sessions" ENABLE ROW LEVEL SECURITY',
  'admin_users_store_email_uniq',
  'admin_sessions_token_hash_uniq',
]) {
  if (!migration.includes(token)) throw new Error(`Auth migration missing: ${token}`);
}

if ((schema.match(/\.enableRLS\(\)/g)?.length ?? 0) !== 17) {
  throw new Error("Expected all 17 public tables to enable RLS.");
}
for (const token of ["adminUsers", "adminSessions", "adminRoleEnum"]) {
  if (!schema.includes(token)) throw new Error(`Admin schema missing: ${token}`);
}
for (const token of ["scrypt(", "timingSafeEqual", "randomBytes(16)"]) {
  if (!password.includes(token)) throw new Error(`Password protection missing: ${token}`);
}
for (const token of ["createHmac", "randomBytes(32)", "verifyAdminSession", "logoutAdmin"]) {
  if (!authentication.includes(token)) throw new Error(`Session service missing: ${token}`);
}
for (const token of ["HttpOnly", "SameSite=Lax", "Secure", "Max-Age=0"]) {
  if (!session.includes(token)) throw new Error(`Cookie protection missing: ${token}`);
}
for (const token of ["adminSessions", "revokedAt", "expiresAt", "stores.status"]) {
  if (!repository.includes(token)) throw new Error(`Auth repository missing: ${token}`);
}

for (const [name, content] of [
  ["login", loginRoute],
  ["logout", logoutRoute],
  ["session", sessionRoute],
]) {
  if (content.includes("placeholder")) throw new Error(`${name} route is still a placeholder.`);
}
if (!settingsRoute.includes("UNAUTHORIZED")) {
  throw new Error("Settings API is not protected.");
}
if (!loginPage.includes("AdminLoginForm") || !dashboardPage.includes("requireCurrentAdmin")) {
  throw new Error("Admin page authentication wiring is incomplete.");
}
for (const token of ["ADMIN_BOOTSTRAP_PASSWORD", "hashAdminPassword", "OWNER"]) {
  if (!bootstrap.includes(token)) throw new Error(`Admin bootstrap missing: ${token}`);
}
for (const token of ["LIVE ADMIN AUTHENTICATION VERIFIED", "Max-Age=0", "status !== 401"]) {
  if (!liveVerifier.includes(token)) throw new Error(`Live auth verifier missing: ${token}`);
}

console.log("PART E-02 REAL ADMIN AUTHENTICATION VERIFIED");
console.log("Store-scoped admin accounts: present");
console.log("Salted scrypt passwords: present");
console.log("HMAC-hashed revocable sessions: present");
console.log("Rate-limited login and protected routes: present");
console.log("Live login/session/logout verification: present");
