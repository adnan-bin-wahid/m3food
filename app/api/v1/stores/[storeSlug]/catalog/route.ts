import { randomUUID } from "node:crypto";
import { DrizzleCatalogRepository } from "../../../../../../src/lib/db/catalog-repository";
import { safeServerError } from "../../../../../../src/lib/http/api-response";
import { handleCatalogGet } from "../../../../../../src/lib/http/catalog-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ storeSlug: string }> },
) {
  try {
    const { storeSlug } = await context.params;
    return handleCatalogGet(storeSlug, new DrizzleCatalogRepository());
  } catch (error) {
    return safeServerError(error, randomUUID());
  }
}
