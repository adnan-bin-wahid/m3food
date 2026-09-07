import assert from "node:assert/strict";
import test from "node:test";
import type {
  AdminAccount,
  AdminAuthRepository,
  AdminIdentity,
  NewAdminSession,
} from "../auth/admin-repository";
import { hashAdminPassword } from "../auth/password";
import type { RateLimiter } from "./rate-limiter";
import { handleAdminLogin } from "./admin-auth-handlers";

class MemoryRepository implements AdminAuthRepository {
  sessions: NewAdminSession[] = [];

  constructor(readonly account: AdminAccount) {}

  async findAccount(storeSlug: string, email: string) {
    return this.account.storeSlug === storeSlug && this.account.email === email
      ? this.account
      : null;
  }

  async createSession(session: NewAdminSession) {
    this.sessions.push(session);
  }

  async findSession(): Promise<AdminIdentity | null> {
    return null;
  }

  async revokeSession() {}
}

const allowedLimiter: RateLimiter = {
  async consume() {
    return { allowed: true, remaining: 7, retryAfterSeconds: 0 };
  },
};

async function createRepository() {
  return new MemoryRepository({
    id: "admin-1",
    storeId: "store-1",
    storeSlug: "m3food",
    email: "owner@example.com",
    displayName: "Store Owner",
    role: "OWNER",
    passwordHash: await hashAdminPassword("correct-horse-battery"),
    isActive: true,
  });
}

function loginRequest(password = "correct-horse-battery") {
  return new Request("https://m3food.local/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      storeSlug: "m3food",
      email: "owner@example.com",
      password,
    }),
  });
}

test("a valid admin login returns only safe identity data and an HTTP-only cookie", async () => {
  const repository = await createRepository();
  const response = await handleAdminLogin(loginRequest(), {
    repository,
    rateLimiter: allowedLimiter,
    sessionSecret: "session-secret-that-is-longer-than-thirty-two-characters",
    createRequestId: () => "request-1",
  });
  const body = JSON.stringify(await response.json());

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/);
  assert.ok(!body.includes("passwordHash"));
  assert.ok(!body.includes("correct-horse-battery"));
  assert.equal(repository.sessions.length, 1);
});

test("invalid credentials use a generic 401 and never create a cookie", async () => {
  const repository = await createRepository();
  const response = await handleAdminLogin(loginRequest("incorrect-password-value"), {
    repository,
    rateLimiter: allowedLimiter,
    sessionSecret: "session-secret-that-is-longer-than-thirty-two-characters",
    createRequestId: () => "request-2",
  });
  const payload = (await response.json()) as { error?: { code?: string } };

  assert.equal(response.status, 401);
  assert.equal(payload.error?.code, "INVALID_CREDENTIALS");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(repository.sessions.length, 0);
});

test("rate-limited login attempts are rejected before password verification", async () => {
  const repository = await createRepository();
  const response = await handleAdminLogin(loginRequest(), {
    repository,
    rateLimiter: {
      async consume() {
        return { allowed: false, remaining: 0, retryAfterSeconds: 30 };
      },
    },
    sessionSecret: "session-secret-that-is-longer-than-thirty-two-characters",
    createRequestId: () => "request-3",
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "30");
  assert.equal(repository.sessions.length, 0);
});
