export type ApiErrorCode =
  | "INVALID_CONTENT_TYPE"
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "MISSING_IDEMPOTENCY_KEY"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
