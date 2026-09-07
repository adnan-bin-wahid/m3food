import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type {
  AdminAuthRepository,
  AdminIdentity,
} from "./admin-repository";
import { verifyAdminPassword } from "./password";

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = `scrypt$16384$8$1$${Buffer.alloc(16).toString("base64url")}$${Buffer.alloc(64).toString("base64url")}`;

export class AdminAuthError extends Error {
  constructor(
    public readonly code: "INVALID_CREDENTIALS" | "ACCOUNT_INACTIVE",
    message: string,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export interface AdminLoginInput {
  storeSlug: string;
  email: string;
  password: string;
}

export interface AdminLoginResult {
  identity: AdminIdentity;
  sessionToken: string;
  expiresAt: Date;
}

export interface AdminAuthDependencies {
  now(): Date;
  createSessionId(): string;
  createSessionToken(): string;
}

const defaultDependencies: AdminAuthDependencies = {
  now: () => new Date(),
  createSessionId: () => randomUUID(),
  createSessionToken: () => randomBytes(32).toString("base64url"),
};

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashAdminSessionToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function loginAdmin(
  input: AdminLoginInput,
  repository: AdminAuthRepository,
  sessionSecret: string,
  dependencyOverrides: Partial<AdminAuthDependencies> = {},
): Promise<AdminLoginResult> {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides };
  const email = normalizeAdminEmail(input.email);
  const account = await repository.findAccount(input.storeSlug, email);
  const passwordValid = await verifyAdminPassword(
    input.password,
    account?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!account || !passwordValid) {
    throw new AdminAuthError(
      "INVALID_CREDENTIALS",
      "The email or password is incorrect.",
    );
  }
  if (!account.isActive) {
    throw new AdminAuthError("ACCOUNT_INACTIVE", "The admin account is inactive.");
  }

  const now = dependencies.now();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  const sessionToken = dependencies.createSessionToken();
  await repository.createSession({
    id: dependencies.createSessionId(),
    adminUserId: account.id,
    tokenHash: hashAdminSessionToken(sessionToken, sessionSecret),
    createdAt: now,
    expiresAt,
  });

  return {
    identity: {
      id: account.id,
      storeId: account.storeId,
      storeSlug: account.storeSlug,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
    },
    sessionToken,
    expiresAt,
  };
}

export async function verifyAdminSession(
  sessionToken: string | null,
  repository: AdminAuthRepository,
  sessionSecret: string,
  now = new Date(),
) {
  if (!sessionToken) return null;
  return repository.findSession(
    hashAdminSessionToken(sessionToken, sessionSecret),
    now,
  );
}

export async function logoutAdmin(
  sessionToken: string | null,
  repository: AdminAuthRepository,
  sessionSecret: string,
  now = new Date(),
) {
  if (!sessionToken) return;
  await repository.revokeSession(
    hashAdminSessionToken(sessionToken, sessionSecret),
    now,
  );
}
