export function jsonApiResponse(
  body: unknown,
  status: number,
  requestId: string,
  extraHeaders: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": requestId,
      ...extraHeaders,
    },
  });
}

export function safeServerError(error: unknown, requestId: string) {
  const isObj = error !== null && typeof error === "object";
  const errRecord = isObj ? (error as Record<string, unknown>) : null;

  const causeObj =
    errRecord && "cause" in errRecord && errRecord.cause !== null && typeof errRecord.cause === "object"
      ? (errRecord.cause as Record<string, unknown>)
      : null;

  const db = errRecord
    ? {
        code: "code" in errRecord && errRecord.code != null ? String(errRecord.code) : undefined,
        detail: "detail" in errRecord && errRecord.detail != null ? String(errRecord.detail) : undefined,
        constraint:
          "constraint_name" in errRecord && errRecord.constraint_name != null
            ? String(errRecord.constraint_name)
            : "constraint" in errRecord && errRecord.constraint != null
              ? String(errRecord.constraint)
              : undefined,
        table:
          "table_name" in errRecord && errRecord.table_name != null
            ? String(errRecord.table_name)
            : "table" in errRecord && errRecord.table != null
              ? String(errRecord.table)
              : undefined,
        column:
          "column_name" in errRecord && errRecord.column_name != null
            ? String(errRecord.column_name)
            : "column" in errRecord && errRecord.column != null
              ? String(errRecord.column)
              : undefined,
      }
    : undefined;

  const hasDb = db && Object.values(db).some((v) => v !== undefined);

  const details = {
    name: errRecord && "name" in errRecord ? String(errRecord.name) : "UnknownError",
    message: errRecord && "message" in errRecord ? String(errRecord.message) : undefined,
    code: errRecord && "code" in errRecord ? String(errRecord.code) : undefined,
    stack: errRecord && "stack" in errRecord ? String(errRecord.stack) : undefined,
    cause: causeObj
      ? {
          name: "name" in causeObj && causeObj.name != null ? String(causeObj.name) : undefined,
          message: "message" in causeObj && causeObj.message != null ? String(causeObj.message) : undefined,
          stack: "stack" in causeObj && causeObj.stack != null ? String(causeObj.stack) : undefined,
        }
      : undefined,
    db: hasDb ? db : undefined,
  };

  console.error("Commerce API request failed.", { requestId, ...details });

  return jsonApiResponse(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "The request could not be completed.",
        requestId,
      },
    },
    500,
    requestId,
  );
}
