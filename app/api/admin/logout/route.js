import { getAdminAuthEnvironment } from '../../../../src/lib/config/server-env';
import { DrizzleAdminAuthRepository } from '../../../../src/lib/db/admin-auth-repository';
import { handleAdminLogout } from '../../../../src/lib/http/admin-auth-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { ADMIN_SESSION_SECRET } = getAdminAuthEnvironment();
  return handleAdminLogout(request, {
    repository: new DrizzleAdminAuthRepository(),
    sessionSecret: ADMIN_SESSION_SECRET,
  });
}
