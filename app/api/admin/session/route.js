import { getAdminAuthEnvironment } from '../../../../src/lib/config/server-env';
import { DrizzleAdminAuthRepository } from '../../../../src/lib/db/admin-auth-repository';
import { handleAdminSession } from '../../../../src/lib/http/admin-auth-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { ADMIN_SESSION_SECRET } = getAdminAuthEnvironment();
  return handleAdminSession(request, {
    repository: new DrizzleAdminAuthRepository(),
    sessionSecret: ADMIN_SESSION_SECRET,
  });
}
