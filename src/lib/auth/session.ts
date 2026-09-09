export const ADMIN_SESSION_COOKIE = "niyamah_attires_admin_session";

export function readAdminSessionToken(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() !== ADMIN_SESSION_COOKIE) continue;
    try {
      const value = decodeURIComponent(pair.slice(separator + 1).trim());
      return /^[A-Za-z0-9_-]{40,100}$/.test(value) ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function createAdminSessionCookie(
  token: string,
  expiresAt: Date,
  secure = process.env.NODE_ENV === "production",
) {
  const maxAge = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / 1000),
  );
  return [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function clearAdminSessionCookie(
  secure = process.env.NODE_ENV === "production",
) {
  return [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}
