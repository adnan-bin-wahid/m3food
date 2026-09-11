/**
 * Global Feature Flags for Commerce & Storefront.
 *
 * PHONE_OTP_REQUIRED:
 * Set to `false` to temporarily disable phone OTP requirement at checkout.
 * Set to `true` to re-enable phone OTP verification.
 * Can also be overridden by setting the PHONE_OTP_REQUIRED environment variable.
 */
export const PHONE_OTP_REQUIRED: boolean =
  typeof process !== "undefined" && process.env.PHONE_OTP_REQUIRED !== undefined
    ? process.env.PHONE_OTP_REQUIRED === "true"
    : typeof process !== "undefined" && process.env.NEXT_PUBLIC_PHONE_OTP_REQUIRED !== undefined
      ? process.env.NEXT_PUBLIC_PHONE_OTP_REQUIRED === "true"
      : false;
