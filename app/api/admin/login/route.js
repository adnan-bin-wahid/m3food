import { getAdminAuthEnvironment } from '../../../../src/lib/config/server-env';
import { DrizzleAdminAuthRepository } from '../../../../src/lib/db/admin-auth-repository';
import { DrizzleRateLimiter } from '../../../../src/lib/db/rate-limiter';
import { handleAdminLogin } from '../../../../src/lib/http/admin-auth-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { ADMIN_SESSION_SECRET, RATE_LIMIT_SALT } = getAdminAuthEnvironment();
  return handleAdminLogin(request, {
    repository: new DrizzleAdminAuthRepository(),
    rateLimiter: new DrizzleRateLimiter(RATE_LIMIT_SALT),
    sessionSecret: ADMIN_SESSION_SECRET,
  });
}
