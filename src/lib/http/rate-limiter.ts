export interface RateLimitInput {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
  now: Date;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  consume(input: RateLimitInput): Promise<RateLimitDecision>;
}

export function getRequestClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
    ?.split(",", 1)[0]
    ?.trim();
  return (
    request.headers.get("x-vercel-forwarded-for")?.trim() ||
    forwarded ||
    request.headers.get("x-real-ip")?.trim() ||
    "local-or-unknown"
  );
}
