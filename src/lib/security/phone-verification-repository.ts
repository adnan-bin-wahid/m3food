export interface StartPhoneChallengeInput {
  id: string;
  storeSlug: string;
  phone: string;
  codeHash: string;
  expiresAt: Date;
  resendAfter: Date;
  maxAttempts: number;
  now: Date;
}

export type StartPhoneChallengeResult =
  | { kind: "CREATED"; storeId: string }
  | { kind: "STORE_NOT_AVAILABLE" }
  | { kind: "COOLDOWN"; retryAfterSeconds: number };

export interface VerifyPhoneChallengeInput {
  challengeId: string;
  storeSlug: string;
  phone: string;
  codeHash: string;
  now: Date;
}

export type VerifyPhoneChallengeResult =
  | { kind: "VERIFIED"; verifiedAt: Date }
  | { kind: "NOT_FOUND" }
  | { kind: "EXPIRED" }
  | { kind: "INVALID" }
  | { kind: "INVALID_CODE"; attemptsRemaining: number }
  | { kind: "LOCKED" };

export interface PhoneVerificationRepository {
  startChallenge(
    input: StartPhoneChallengeInput,
  ): Promise<StartPhoneChallengeResult>;
  verifyChallenge(
    input: VerifyPhoneChallengeInput,
  ): Promise<VerifyPhoneChallengeResult>;
  invalidateChallenge(challengeId: string, now: Date): Promise<void>;
}
