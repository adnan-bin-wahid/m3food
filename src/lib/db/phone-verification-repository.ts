import {
  and,
  desc,
  eq,
  isNull,
  sql,
} from "drizzle-orm";
import type {
  PhoneVerificationRepository,
  StartPhoneChallengeInput,
  VerifyPhoneChallengeInput,
} from "../security/phone-verification-repository";
import { getDatabase, type Database } from "./index";
import {
  phoneVerificationChallenges,
  stores,
} from "./schema";

export class DrizzlePhoneVerificationRepository
  implements PhoneVerificationRepository
{
  constructor(private readonly database: Database = getDatabase()) {}

  async startChallenge(input: StartPhoneChallengeInput) {
    return this.database.transaction(async (transaction) => {
      const lockKey = `${input.storeSlug}\u0000${input.phone}`;
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`,
      );

      const [store] = await transaction
        .select({ id: stores.id })
        .from(stores)
        .where(
          and(
            eq(stores.slug, input.storeSlug),
            eq(stores.status, "ACTIVE"),
          ),
        )
        .limit(1);

      if (!store) return { kind: "STORE_NOT_AVAILABLE" } as const;

      const [latest] = await transaction
        .select({
          id: phoneVerificationChallenges.id,
          resendAfter: phoneVerificationChallenges.resendAfter,
        })
        .from(phoneVerificationChallenges)
        .where(
          and(
            eq(phoneVerificationChallenges.storeId, store.id),
            eq(phoneVerificationChallenges.phone, input.phone),
            isNull(phoneVerificationChallenges.consumedAt),
            isNull(phoneVerificationChallenges.invalidatedAt),
          ),
        )
        .orderBy(
          desc(phoneVerificationChallenges.createdAt),
          desc(phoneVerificationChallenges.id),
        )
        .limit(1);

      if (
        latest &&
        latest.resendAfter.getTime() > input.now.getTime()
      ) {
        return {
          kind: "COOLDOWN",
          retryAfterSeconds: Math.max(
            1,
            Math.ceil(
              (latest.resendAfter.getTime() - input.now.getTime()) / 1000,
            ),
          ),
        } as const;
      }

      await transaction
        .update(phoneVerificationChallenges)
        .set({
          invalidatedAt: input.now,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(phoneVerificationChallenges.storeId, store.id),
            eq(phoneVerificationChallenges.phone, input.phone),
            isNull(phoneVerificationChallenges.consumedAt),
            isNull(phoneVerificationChallenges.invalidatedAt),
          ),
        );

      await transaction.insert(phoneVerificationChallenges).values({
        id: input.id,
        storeId: store.id,
        phone: input.phone,
        codeHash: input.codeHash,
        attemptCount: 0,
        maxAttempts: input.maxAttempts,
        expiresAt: input.expiresAt,
        resendAfter: input.resendAfter,
        createdAt: input.now,
        updatedAt: input.now,
      });

      return { kind: "CREATED", storeId: store.id } as const;
    });
  }

  async verifyChallenge(input: VerifyPhoneChallengeInput) {
    return this.database.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${input.challengeId}))`,
      );

      const [challenge] = await transaction
        .select({
          id: phoneVerificationChallenges.id,
          phone: phoneVerificationChallenges.phone,
          codeHash: phoneVerificationChallenges.codeHash,
          attemptCount: phoneVerificationChallenges.attemptCount,
          maxAttempts: phoneVerificationChallenges.maxAttempts,
          expiresAt: phoneVerificationChallenges.expiresAt,
          verifiedAt: phoneVerificationChallenges.verifiedAt,
          consumedAt: phoneVerificationChallenges.consumedAt,
          invalidatedAt: phoneVerificationChallenges.invalidatedAt,
        })
        .from(phoneVerificationChallenges)
        .innerJoin(
          stores,
          eq(stores.id, phoneVerificationChallenges.storeId),
        )
        .where(
          and(
            eq(phoneVerificationChallenges.id, input.challengeId),
            eq(phoneVerificationChallenges.phone, input.phone),
            eq(stores.slug, input.storeSlug),
            eq(stores.status, "ACTIVE"),
          ),
        )
        .limit(1)
        .for("update");

      if (!challenge) return { kind: "NOT_FOUND" } as const;
      if (challenge.consumedAt || challenge.invalidatedAt) {
        return { kind: "INVALID" } as const;
      }
      if (challenge.verifiedAt) {
        return {
          kind: "VERIFIED",
          verifiedAt: challenge.verifiedAt,
        } as const;
      }
      if (challenge.expiresAt.getTime() <= input.now.getTime()) {
        await transaction
          .update(phoneVerificationChallenges)
          .set({
            invalidatedAt: input.now,
            updatedAt: input.now,
          })
          .where(eq(phoneVerificationChallenges.id, challenge.id));
        return { kind: "EXPIRED" } as const;
      }
      if (challenge.attemptCount >= challenge.maxAttempts) {
        return { kind: "LOCKED" } as const;
      }

      if (challenge.codeHash !== input.codeHash) {
        const nextAttemptCount = challenge.attemptCount + 1;
        const locked = nextAttemptCount >= challenge.maxAttempts;
        await transaction
          .update(phoneVerificationChallenges)
          .set({
            attemptCount: nextAttemptCount,
            invalidatedAt: locked ? input.now : null,
            updatedAt: input.now,
          })
          .where(eq(phoneVerificationChallenges.id, challenge.id));

        return locked
          ? ({ kind: "LOCKED" } as const)
          : ({
              kind: "INVALID_CODE",
              attemptsRemaining:
                challenge.maxAttempts - nextAttemptCount,
            } as const);
      }

      const [updated] = await transaction
        .update(phoneVerificationChallenges)
        .set({
          verifiedAt: input.now,
          updatedAt: input.now,
        })
        .where(eq(phoneVerificationChallenges.id, challenge.id))
        .returning({
          verifiedAt: phoneVerificationChallenges.verifiedAt,
        });

      if (!updated?.verifiedAt) {
        throw new Error("Phone verification update returned no timestamp.");
      }

      return {
        kind: "VERIFIED",
        verifiedAt: updated.verifiedAt,
      } as const;
    });
  }

  async invalidateChallenge(challengeId: string, now: Date) {
    await this.database
      .update(phoneVerificationChallenges)
      .set({
        invalidatedAt: now,
        updatedAt: now,
      })
      .where(eq(phoneVerificationChallenges.id, challengeId));
  }
}
