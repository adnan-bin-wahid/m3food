export type CommerceErrorCode =
  | "IDEMPOTENCY_CONFLICT"
  | "OUT_OF_STOCK"
  | "STORE_NOT_AVAILABLE"
  | "VARIANT_NOT_AVAILABLE"
  | "PHONE_VERIFICATION_REQUIRED"
  | "RECENT_DUPLICATE_ORDER";

export class CommerceError extends Error {
  constructor(
    public readonly code: CommerceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CommerceError";
  }
}
