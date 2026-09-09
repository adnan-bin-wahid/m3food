import assert from "node:assert/strict";
import test from "node:test";
import {
  deliverOrderOtp,
  OtpDeliveryError,
} from "./otp-delivery";

test("disabled OTP delivery fails closed", async () => {
  await assert.rejects(
    () =>
      deliverOrderOtp(
        {
          phone: "01712345678",
          code: "123456",
          expiresInMinutes: 5,
        },
        { PHONE_OTP_DELIVERY_MODE: "DISABLED" },
      ),
    (error: unknown) =>
      error instanceof OtpDeliveryError &&
      error.code === "NOT_CONFIGURED",
  );
});

test("webhook OTP delivery sends E.164 phone without leaking credentials in the payload", async () => {
  let requestBody: { to?: string; message?: string; token?: string } | undefined;
  let authorization = "";
  const fakeFetch: typeof fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response("{}", { status: 200 });
  };

  await deliverOrderOtp(
    {
      phone: "01712345678",
      code: "123456",
      expiresInMinutes: 5,
    },
    {
      PHONE_OTP_DELIVERY_MODE: "WEBHOOK",
      PHONE_OTP_WEBHOOK_URL: "https://sms.example.test/send",
      PHONE_OTP_WEBHOOK_BEARER_TOKEN: "server-only-token",
    },
    fakeFetch,
  );

  assert.equal(requestBody?.to, "+8801712345678");
  assert.match(String(requestBody?.message), /123456/);
  assert.equal(authorization, "Bearer server-only-token");
  assert.equal(requestBody?.token, undefined);
});

