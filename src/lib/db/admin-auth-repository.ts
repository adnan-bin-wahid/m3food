import { and, eq, gt, isNull } from "drizzle-orm";
import type {
  AdminAuthRepository,
  NewAdminSession,
} from "../auth/admin-repository";
import { getDatabase, type Database } from "./index";
import { adminSessions, adminUsers, stores } from "./schema";

export class DrizzleAdminAuthRepository implements AdminAuthRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async findAccount(storeSlug: string, email: string) {
    const [account] = await this.database
      .select({
        id: adminUsers.id,
        storeId: stores.id,
        storeSlug: stores.slug,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
        passwordHash: adminUsers.passwordHash,
        isActive: adminUsers.isActive,
      })
      .from(adminUsers)
      .innerJoin(stores, eq(stores.id, adminUsers.storeId))
      .where(
        and(
          eq(stores.slug, storeSlug),
          eq(stores.status, "ACTIVE"),
          eq(adminUsers.email, email),
        ),
      )
      .limit(1);
    return account ?? null;
  }

  async createSession(session: NewAdminSession) {
    await this.database.transaction(async (transaction) => {
      await transaction.insert(adminSessions).values(session);
      await transaction
        .update(adminUsers)
        .set({
          lastLoginAt: session.createdAt,
          updatedAt: session.createdAt,
        })
        .where(eq(adminUsers.id, session.adminUserId));
    });
  }

  async findSession(tokenHash: string, now: Date) {
    const [identity] = await this.database
      .select({
        id: adminUsers.id,
        storeId: stores.id,
        storeSlug: stores.slug,
        email: adminUsers.email,
        displayName: adminUsers.displayName,
        role: adminUsers.role,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.adminUserId))
      .innerJoin(stores, eq(stores.id, adminUsers.storeId))
      .where(
        and(
          eq(adminSessions.tokenHash, tokenHash),
          isNull(adminSessions.revokedAt),
          gt(adminSessions.expiresAt, now),
          eq(adminUsers.isActive, true),
          eq(stores.status, "ACTIVE"),
        ),
      )
      .limit(1);
    return identity ?? null;
  }

  async revokeSession(tokenHash: string, now: Date) {
    await this.database
      .update(adminSessions)
      .set({ revokedAt: now, lastSeenAt: now })
      .where(
        and(
          eq(adminSessions.tokenHash, tokenHash),
          isNull(adminSessions.revokedAt),
        ),
      );
  }
}
