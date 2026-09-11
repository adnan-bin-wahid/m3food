import { ZodError } from "zod";
import { AdminCustomerError, getAdminMarketingAudience } from "../../../../../src/lib/admin/customer-admin-service";
import { getCurrentAdmin } from "../../../../../src/lib/auth/current-admin";
import { DrizzleAdminCustomerRepository } from "../../../../../src/lib/db/admin-customer-repository";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const channel = new URL(request.url).searchParams.get("channel") ?? "";
  let rows;
  try {
    rows = await getAdminMarketingAudience(admin, channel, new DrizzleAdminCustomerRepository());
  } catch (error) {
    if (error instanceof AdminCustomerError && error.code === "FORBIDDEN") {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    if (error instanceof ZodError) return Response.json({ error: "INVALID_CHANNEL" }, { status: 400 });
    throw error;
  }

  const header = ["customer_id", "name", "phone", "email", "delivered_orders", "delivered_revenue_minor", "last_order_at", "consent_captured_at"];
  const body = rows.map((row) => [
    row.customerId,
    row.name,
    row.phone,
    row.email ?? "",
    row.deliveredOrderCount,
    row.deliveredRevenueMinor,
    row.lastOrderAt?.toISOString() ?? "",
    row.consentCapturedAt.toISOString(),
  ]);
  const csv = [header, ...body].map((line) => line.map(csvCell).join(",")).join("\r\n") + "\r\n";
  const safeChannel = channel.toLowerCase();
  const safeStore = admin.storeSlug || "niyamah";
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeStore}-${safeChannel}-audience.csv"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
