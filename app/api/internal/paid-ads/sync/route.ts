import {
  getCronSecret,
  isCronAuthorizationValid,
} from "../../../../../src/lib/config/cron-secret";
import {
  runScheduledPaidAdsSync,
} from "../../../../../src/lib/admin/paid-ads-scheduler-service";
import { syncAdminPaidAdAccount } from "../../../../../src/lib/admin/paid-ads-sync-service";
import { DrizzlePaidAdsSchedulerRepository } from "../../../../../src/lib/db/admin-paid-ads-scheduler-repository";
import { DrizzleAdminPaidAdsSyncRepository } from "../../../../../src/lib/db/admin-paid-ads-sync-repository";
import { resolvePaidAdsProviderClient } from "../../../../../src/lib/marketing/paid-ads-provider-factory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  let secret: string | null;

  try {
    secret = getCronSecret();
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Scheduled sync is misconfigured.",
      },
      { status: 503 },
    );
  }

  if (!secret) {
    return Response.json(
      {
        ok: false,
        error: "Scheduled sync is not configured.",
      },
      { status: 503 },
    );
  }

  if (
    !isCronAuthorizationValid(
      request.headers.get("authorization"),
      secret,
    )
  ) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const syncRepository =
    new DrizzleAdminPaidAdsSyncRepository();

  const result = await runScheduledPaidAdsSync(
    new DrizzlePaidAdsSchedulerRepository(),
    (admin, input) =>
      syncAdminPaidAdAccount(
        admin,
        input,
        syncRepository,
        (provider) =>
          resolvePaidAdsProviderClient(provider),
      ),
  );

  return Response.json({
    ok: result.failed === 0,
    ...result,
  });
}
