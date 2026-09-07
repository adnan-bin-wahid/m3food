import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "./api-error";
import { readBoundedJson } from "./request-body";

test("a JSON body is decoded within the byte limit", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true }),
  });

  assert.deepEqual(await readBoundedJson(request, 1024), { ok: true });
});

test("unsupported content types and oversized payloads are rejected", async () => {
  const textRequest = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "hello",
  });
  await assert.rejects(
    () => readBoundedJson(textRequest, 1024),
    (error: unknown) =>
      error instanceof ApiError && error.code === "INVALID_CONTENT_TYPE",
  );

  const largeRequest = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(100) }),
  });
  await assert.rejects(
    () => readBoundedJson(largeRequest, 32),
    (error: unknown) =>
      error instanceof ApiError && error.code === "PAYLOAD_TOO_LARGE",
  );
});

test("malformed JSON is rejected without exposing parser details", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  });

  await assert.rejects(
    () => readBoundedJson(request, 1024),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === "INVALID_JSON" &&
      !error.message.includes("position"),
  );
});
