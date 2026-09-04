import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_SESSION_COOKIE,
  clearAdminSessionCookie,
  createAdminSessionCookie,
  readAdminSessionToken,
} from "./session";

test("admin session cookies are HTTP-only and scoped to the application", () => {
  const token = "a".repeat(43);
  const cookie = createAdminSessionCookie(
    token,
    new Date(Date.now() + 60_000),
    true,
  );
  assert.match(cookie, new RegExp(`^${ADMIN_SESSION_COOKIE}=`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
  assert.equal(readAdminSessionToken(cookie), token);
});

test("malformed session tokens are rejected and logout expires the cookie", () => {
  assert.equal(readAdminSessionToken(`${ADMIN_SESSION_COOKIE}=short`), null);
  assert.match(clearAdminSessionCookie(true), /Max-Age=0/);
});
