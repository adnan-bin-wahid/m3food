import { randomUUID } from 'node:crypto';
import { getStoreSettings } from '../../../../src/lib/admin/settings-service';
import { verifyAdminSession } from '../../../../src/lib/auth/admin-auth';
import { readAdminSessionToken } from '../../../../src/lib/auth/session';
import { getAdminAuthEnvironment } from '../../../../src/lib/config/server-env';
import { DrizzleAdminAuthRepository } from '../../../../src/lib/db/admin-auth-repository';
import { DrizzleAdminSettingsRepository } from '../../../../src/lib/db/admin-settings-repository';
import { jsonApiResponse, safeServerError } from '../../../../src/lib/http/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authenticate(request) {
  const { ADMIN_SESSION_SECRET } = getAdminAuthEnvironment();
  return verifyAdminSession(
    readAdminSessionToken(request.headers.get('cookie')),
    new DrizzleAdminAuthRepository(),
    ADMIN_SESSION_SECRET,
  );
}

export async function GET(request) {
  const requestId = randomUUID();
  try {
    const admin = await authenticate(request);
    if (!admin) {
      return jsonApiResponse(
        { error: { code: 'UNAUTHORIZED', message: 'Admin login required.', requestId } },
        401,
        requestId,
      );
    }
    return jsonApiResponse(
      {
        data: {
          storeSlug: admin.storeSlug,
          settings: await getStoreSettings(
            admin,
            new DrizzleAdminSettingsRepository(),
          ),
        },
      },
      200,
      requestId,
    );
  } catch (error) {
    return safeServerError(error, requestId);
  }
}

// Internal settings writes use the authenticated Server Action.
export async function POST(request) {
  const requestId = randomUUID();
  try {
    const admin = await authenticate(request);
    if (!admin) {
      return jsonApiResponse(
        { error: { code: 'UNAUTHORIZED', message: 'Admin login required.', requestId } },
        401,
        requestId,
      );
    }
    return jsonApiResponse(
      { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use the protected settings form.', requestId } },
      405,
      requestId,
      { Allow: 'GET' },
    );
  } catch (error) {
    return safeServerError(error, requestId);
  }
}
