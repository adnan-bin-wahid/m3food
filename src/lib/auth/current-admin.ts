import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuthEnvironment } from "../config/server-env";
import { DrizzleAdminAuthRepository } from "../db/admin-auth-repository";
import { verifyAdminSession } from "./admin-auth";
import { ADMIN_SESSION_COOKIE } from "./session";

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
  const { ADMIN_SESSION_SECRET } = getAdminAuthEnvironment();
  return verifyAdminSession(
    token,
    new DrizzleAdminAuthRepository(),
    ADMIN_SESSION_SECRET,
  );
}

export async function requireCurrentAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
