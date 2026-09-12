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

  const errorName =
    errRecord && "name" in errRecord && errRecord.name != null
      ? String(errRecord.name)
      : "UnknownError";

  const errorCode =
    errRecord && "code" in errRecord && errRecord.code != null
      ? String(errRecord.code)
      : undefined;

  const causeName =
    causeObj && "name" in causeObj && causeObj.name != null
      ? String(causeObj.name)
      : undefined;

  const dbCode =
    (errRecord && "code" in errRecord && errRecord.code != null
      ? String(errRecord.code)
      : undefined) ??
    (causeObj && "code" in causeObj && causeObj.code != null
      ? String(causeObj.code)
      : undefined);

  const constraintName =
    (errRecord && "constraint_name" in errRecord && errRecord.constraint_name != null
      ? String(errRecord.constraint_name)
      : errRecord && "constraint" in errRecord && errRecord.constraint != null
        ? String(errRecord.constraint)
        : undefined) ??
    (causeObj && "constraint_name" in causeObj && causeObj.constraint_name != null
      ? String(causeObj.constraint_name)
      : causeObj && "constraint" in causeObj && causeObj.constraint != null
        ? String(causeObj.constraint)
        : undefined);

  const tableName =
    (errRecord && "table_name" in errRecord && errRecord.table_name != null
      ? String(errRecord.table_name)
      : errRecord && "table" in errRecord && errRecord.table != null
        ? String(errRecord.table)
        : undefined) ??
    (causeObj && "table_name" in causeObj && causeObj.table_name != null
      ? String(causeObj.table_name)
      : causeObj && "table" in causeObj && causeObj.table != null
        ? String(causeObj.table)
        : undefined);

  const columnName =
    (errRecord && "column_name" in errRecord && errRecord.column_name != null
      ? String(errRecord.column_name)
      : errRecord && "column" in errRecord && errRecord.column != null
        ? String(errRecord.column)
        : undefined) ??
    (causeObj && "column_name" in causeObj && causeObj.column_name != null
      ? String(causeObj.column_name)
      : causeObj && "column" in causeObj && causeObj.column != null
        ? String(causeObj.column)
        : undefined);

  console.error("Commerce API request failed.", {
    requestId,
    errorName,
    errorCode,
    causeName,
    dbCode,
    constraintName,
    tableName,
    columnName,
  });

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
