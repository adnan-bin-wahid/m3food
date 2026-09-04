# Part E-02: Real Admin Authentication

This batch replaces every admin authentication placeholder with a real,
store-scoped authentication boundary.

## Security model

- Admin accounts and sessions are stored in Supabase PostgreSQL.
- Passwords are salted and hashed with Node.js `scrypt`; plaintext is never
  stored or logged.
- Browser session tokens contain 256 bits of randomness. Only an HMAC-SHA-256
  token hash is stored in the database.
- The cookie is HTTP-only, SameSite=Lax, path-scoped to the application, and
  Secure in production. Sessions expire after 12 hours and logout revokes the
  database row.
- Login attempts use the existing persistent HMAC rate limiter.
- Login errors do not reveal whether an email exists.
- Admin users and sessions enable RLS like every other public application table.

## User-visible behavior

`/admin/login` contains the working login form. `/admin`, `/admin/dashboard`,
`/admin/orders`, and `/admin/settings` resolve the database session on the
server. Unauthenticated page access redirects to login, and the settings API
returns 401 without a valid session.

The dashboard, orders, and settings pages intentionally label their next
functional batch instead of displaying fake data.

## Verification

The installer creates the initial M3Food owner from credentials entered in the
terminal, then exercises the real login, session, protected API, logout, and
revoked-session flow. Inspect `admin_users` and `admin_sessions` in Supabase.
The administrator password and raw session token must never appear there.
