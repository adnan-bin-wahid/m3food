import { randomUUID } from 'node:crypto';
import { requireCurrentAdmin } from '../../../../../src/lib/auth/current-admin';
import { getMarketingEnvironment } from '../../../../../src/lib/config/server-env';
import { getDatabase } from '../../../../../src/lib/db';
import { stores } from '../../../../../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendMetaCapiEvent } from '../../../../../src/lib/marketing/meta-capi';
import { jsonApiResponse, safeServerError } from '../../../../../src/lib/http/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const requestId = randomUUID();
  try {
    const admin = await requireCurrentAdmin();
    const db = getDatabase();
    const [store] = await db
      .select({
        id: stores.id,
        name: stores.name,
        metaPixelId: stores.metaPixelId,
      })
      .from(stores)
      .where(eq(stores.id, admin.storeId))
      .limit(1);

    const pixelId = store?.metaPixelId;
    if (!pixelId) {
      return jsonApiResponse({
        success: false,
        configured: false,
        error: 'Store does not have a Meta Pixel ID configured.',
        pixelId: null,
      }, 400, requestId);
    }

    let marketing;
    try {
      marketing = getMarketingEnvironment();
    } catch (envErr) {
      return jsonApiResponse({
        success: false,
        configured: false,
        error: envErr.message,
        pixelId,
      }, 200, requestId);
    }

    const hasToken = Boolean(marketing?.META_CAPI_ACCESS_TOKEN);
    const hasVersion = Boolean(marketing?.META_GRAPH_API_VERSION);

    if (!hasToken || !hasVersion) {
      return jsonApiResponse({
        success: false,
        configured: false,
        error: 'META_CAPI_ACCESS_TOKEN or META_GRAPH_API_VERSION is missing in server environment variables.',
        pixelId,
        apiVersion: marketing?.META_GRAPH_API_VERSION || 'not set',
      }, 200, requestId);
    }

    // Ping Meta CAPI with a test PageView event
    const testResult = await sendMetaCapiEvent({
      pixelId,
      analyticsAllowed: true,
      eventName: 'PAGE_VIEW',
      eventId: `TEST_${Date.now()}_${randomUUID().slice(0, 8)}`,
      occurredAt: new Date(),
      pageUrl: 'https://niyamah-attires.vercel.app/admin/marketing/pixel',
      clientIp: '127.0.0.1',
      userAgent: 'Niyamah-Admin-CAPI-Diagnostic/1.0',
    }, marketing);

    return jsonApiResponse({
      success: testResult.sent,
      configured: true,
      pixelId,
      apiVersion: marketing.META_GRAPH_API_VERSION,
      status: testResult.status || 200,
      metaErrorCode: testResult.metaErrorCode,
      metaErrorMessage: testResult.metaErrorMessage,
      fbtraceId: testResult.fbtraceId,
      testedAt: new Date().toISOString(),
    }, 200, requestId);
  } catch (error) {
    return safeServerError(error, requestId);
  }
}
