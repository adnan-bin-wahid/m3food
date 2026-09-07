import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { CommerceError } from "../commerce/commerce-error";
import type { CatalogRepository } from "../commerce/catalog-repository";
import { getStoreCatalog } from "../commerce/catalog-service";
import { jsonApiResponse, safeServerError } from "./api-response";

export async function handleCatalogGet(
  storeSlug: unknown,
  repository: CatalogRepository,
  createRequestId: () => string = randomUUID,
) {
  const requestId = createRequestId();

  try {
    const catalog = await getStoreCatalog(storeSlug, repository);
    return jsonApiResponse({ data: catalog }, 200, requestId, {
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonApiResponse(
        {
          error: {
            code: "INVALID_STORE_SLUG",
            message: "The store slug is invalid.",
            requestId,
          },
        },
        400,
        requestId,
      );
    }
    if (error instanceof CommerceError && error.code === "STORE_NOT_AVAILABLE") {
      return jsonApiResponse(
        {
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
        },
        404,
        requestId,
      );
    }
    return safeServerError(error, requestId);
  }
}
