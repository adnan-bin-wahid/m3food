# Anti-Fake Order Guard

This is the minimum Bangladesh COD anti-fake-order layer for the reusable commerce template.

## Final order flow

1. Customer fills the order form.
2. Bangladesh mobile number is normalized to `01XXXXXXXXX`.
3. A six-digit OTP is requested.
4. OTP is rate-limited by both request IP and normalized phone.
5. OTP is stored only as an HMAC-SHA256 hash.
6. OTP expires after 5 minutes, has a 60-second resend cooldown, and allows at most 5 wrong attempts.
7. Successful verification issues a short-lived signed verification token.
8. The final order request must present that token for the same store and normalized phone.
9. The verified challenge is consumed atomically with order creation, so it cannot create a second order.
10. A same-phone + same-address + same-variant + same-quantity repeat within 10 minutes is blocked.
11. Previous order history is evaluated at order creation:
    - previous orders in 1 hour / 24 hours
    - same phone + address today
    - delivered history
    - cancelled history
    - returned history
12. The order stores an immutable `LOW`, `MEDIUM`, or `HIGH` risk snapshot.
13. `HIGH` risk sets `manual_review_required = true`.
14. Admin order screens show verification, risk signals, and previous outcome counts.
15. Existing order lifecycle still starts at `PENDING`; therefore a HIGH-risk order must be manually moved to `CONFIRMED` before the existing Steadfast flow can be used.

## SMS delivery modes

### DEV
For local development only. The OTP is printed to the server console and returned to the local storefront so the complete flow can be tested without an SMS account.

`DEV` is rejected when `NODE_ENV=production`.

### WEBHOOK
Production-neutral transport. The server POSTs a transactional message payload to the configured server-side webhook URL. A client-specific SMS provider can be connected behind that URL without changing checkout/order logic.

### DISABLED
Fails closed. OTP cannot be sent and therefore no OTP-gated order can be created.

## Environment

```env
PHONE_OTP_SECRET=
PHONE_OTP_DELIVERY_MODE=DEV
PHONE_OTP_WEBHOOK_URL=
PHONE_OTP_WEBHOOK_BEARER_TOKEN=
```

If `PHONE_OTP_SECRET` is blank, the existing server-only `RATE_LIMIT_SALT` is used as the HMAC fallback.

## Deliberately not included

This remains a minimum practical guard, not an enterprise fraud engine. It does not add machine learning, paid phone intelligence, device fingerprinting, cross-merchant blacklists, or automatic customer cancellation.
