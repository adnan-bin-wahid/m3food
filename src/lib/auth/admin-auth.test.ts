import assert from "node:assert/strict";
import test from "node:test";
import type {
  AdminAccount,
  AdminAuthRepository,
  AdminIdentity,
  NewAdminSession,
} from "./admin-repository";
import {
  AdminAuthError,
  hashAdminSessionToken,
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
} from "./admin-auth";
import { hashAdminPassword } from "./password";

const sessionSecret = "session-secret-that-is-longer-than-thirty-two-characters";

class MemoryAdminRepository implements AdminAuthRepository {
  sessions: NewAdminSession[] = [];
  revoked = new Set<string>();

  constructor(private readonly account: AdminAccount | null) {}

  async findAccount(storeSlug: string, email: string) {
    return this.account?.storeSlug === storeSlug && this.account.email === email
      ? this.account
      : null;
  }

  async createSession(session: NewAdminSession) {
    this.sessions.push(session);
  }

  async findSession(tokenHash: string, now: Date) {
    const session = this.sessions.find((item) => item.tokenHash === tokenHash);
    if (
      !session ||
      this.revoked.has(tokenHash) ||
      session.expiresAt.getTime() <= now.getTime() ||
      !this.account?.isActive
    ) {
      return null;
    }
    const { passwordHash: _passwordHash, isActive: _isActive, ...identity } =
      this.account;
    return identity satisfies AdminIdentity;
  }

  async revokeSession(tokenHash: string) {
    this.revoked.add(tokenHash);
  }
}

async function createAccount(overrides: Partial<AdminAccount> = {}) {
  return {
    id: "admin-1",
    storeId: "store-1",
    storeSlug: "m3food",
    email: "owner@example.com",
    displayName: "Store Owner",
    role: "OWNER" as const,
    passwordHash: await hashAdminPassword("correct-horse-battery"),
    isActive: true,
    ...overrides,
  };
}

test("passwords use salted scrypt hashes", async () => {
  const first = await hashAdminPassword("correct-horse-battery");
  const second = await hashAdminPassword("correct-horse-battery");
  assert.notEqual(first, second);
  assert.ok(first.startsWith("scrypt$16384$8$1$"));
  assert.ok(!first.includes("correct-horse-battery"));
});

test("login creates an opaque hashed session that can be revoked", async () => {
  const repository = new MemoryAdminRepository(await createAccount());
  const now = new Date("2026-09-04T12:00:00.000Z");
  const token = "a".repeat(43);
  const result = await loginAdmin(
    {
      storeSlug: "m3food",
      email: " OWNER@EXAMPLE.COM ",
      password: "correct-horse-battery",
    },
    repository,
    sessionSecret,
    {
      now: () => now,
      createSessionId: () => "session-1",
      createSessionToken: () => token,
    },
  );

  assert.equal(result.identity.role, "OWNER");
  assert.equal(repository.sessions[0]?.tokenHash, hashAdminSessionToken(token, sessionSecret));
  assert.notEqual(repository.sessions[0]?.tokenHash, token);
  assert.equal(
    (await verifyAdminSession(token, repository, sessionSecret, now))?.email,
    "owner@example.com",
  );

  await logoutAdmin(token, repository, sessionSecret, now);
  assert.equal(await verifyAdminSession(token, repository, sessionSecret, now), null);
});

test("unknown, wrong-password, and inactive accounts never receive a session", async () => {
  const missing = new MemoryAdminRepository(null);
  await assert.rejects(
    loginAdmin(
      { storeSlug: "m3food", email: "none@example.com", password: "wrong-password-value" },
      missing,
      sessionSecret,
    ),
    AdminAuthError,
  );

  const inactive = new MemoryAdminRepository(
    await createAccount({ isActive: false }),
  );
  await assert.rejects(
    loginAdmin(
      { storeSlug: "m3food", email: "owner@example.com", password: "correct-horse-battery" },
      inactive,
      sessionSecret,
    ),
    /inactive/,
  );
  assert.equal(missing.sessions.length, 0);
  assert.equal(inactive.sessions.length, 0);
});
