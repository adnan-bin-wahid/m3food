export type AdminRole = "OWNER" | "ADMIN" | "ORDER_MANAGER" | "ANALYST";

export interface AdminAccount {
  id: string;
  storeId: string;
  storeSlug: string;
  email: string;
  displayName: string;
  role: AdminRole;
  passwordHash: string;
  isActive: boolean;
}

export type AdminIdentity = Omit<AdminAccount, "passwordHash" | "isActive">;

export interface NewAdminSession {
  id: string;
  adminUserId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface AdminAuthRepository {
  findAccount(storeSlug: string, email: string): Promise<AdminAccount | null>;
  createSession(session: NewAdminSession): Promise<void>;
  findSession(tokenHash: string, now: Date): Promise<AdminIdentity | null>;
  revokeSession(tokenHash: string, now: Date): Promise<void>;
}
