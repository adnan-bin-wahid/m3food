import { loadEnvConfig } from "@next/env";
import { POST as login } from "../app/api/admin/login/route";
import { POST as logout } from "../app/api/admin/logout/route";
import { GET as session } from "../app/api/admin/session/route";
import { GET as settings } from "../app/api/admin/settings/route";
import { closeDatabase } from "../src/lib/db";

async function main() {
  loadEnvConfig(process.cwd());
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const storeSlug = process.env.ADMIN_BOOTSTRAP_STORE_SLUG ?? "m3food";
  if (!email || !password) {
    throw new Error("Bootstrap credentials are required only for live verification.");
  }

  const loginResponse = await login(
    new Request("https://m3food.local/api/admin/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
      },
      body: JSON.stringify({ storeSlug, email, password }),
    }),
  );
  const loginPayload = (await loginResponse.json()) as {
    data?: { authenticated?: boolean; admin?: { email?: string; role?: string } };
  };
  const setCookie = loginResponse.headers.get("set-cookie");
  if (
    loginResponse.status !== 200 ||
    !loginPayload.data?.authenticated ||
    loginPayload.data.admin?.email !== email.trim().toLowerCase() ||
    loginPayload.data.admin?.role !== "OWNER" ||
    !setCookie?.includes("HttpOnly") ||
    !setCookie.includes("SameSite=Lax")
  ) {
    throw new Error("The real admin login response is invalid.");
  }
  const cookie = setCookie.split(";", 1)[0];

  const sessionResponse = await session(
    new Request("https://m3food.local/api/admin/session", {
      headers: { cookie },
    }),
  );
  const sessionPayload = (await sessionResponse.json()) as {
    data?: { authenticated?: boolean; admin?: { email?: string } };
  };
  if (
    sessionResponse.status !== 200 ||
    !sessionPayload.data?.authenticated ||
    sessionPayload.data.admin?.email !== email.trim().toLowerCase()
  ) {
    throw new Error("The database-backed admin session was not restored.");
  }

  const unauthorizedSettings = await settings(
    new Request("https://m3food.local/api/admin/settings"),
  );
  const authorizedSettings = await settings(
    new Request("https://m3food.local/api/admin/settings", {
      headers: { cookie },
    }),
  );
  if (unauthorizedSettings.status !== 401 || authorizedSettings.status !== 200) {
    throw new Error("Protected admin API authorization is incorrect.");
  }

  const logoutResponse = await logout(
    new Request("https://m3food.local/api/admin/logout", {
      method: "POST",
      headers: { cookie },
    }),
  );
  if (
    logoutResponse.status !== 200 ||
    !logoutResponse.headers.get("set-cookie")?.includes("Max-Age=0")
  ) {
    throw new Error("Admin logout did not clear the session cookie.");
  }

  const revokedResponse = await session(
    new Request("https://m3food.local/api/admin/session", {
      headers: { cookie },
    }),
  );
  const revokedPayload = (await revokedResponse.json()) as {
    data?: { authenticated?: boolean };
  };
  if (revokedPayload.data?.authenticated !== false) {
    throw new Error("The logged-out session is still accepted.");
  }

  console.log("LIVE ADMIN AUTHENTICATION VERIFIED");
  console.log(`Admin: ${email.trim().toLowerCase()}`);
  console.log("Password: scrypt verified");
  console.log("Session: database-backed, HTTP-only, revoked on logout");
  console.log("Protected API: unauthenticated 401, authenticated 200");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin verification failed.");
    process.exitCode = 1;
  })
  .finally(closeDatabase);
