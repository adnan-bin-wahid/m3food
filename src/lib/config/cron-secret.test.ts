import assert from "node:assert/strict";
import test from "node:test";
import {
  getCronSecret,
  isCronAuthorizationValid,
} from "./cron-secret";

test("cron secret is optional outside scheduled invocation but bounded when configured", () => {
  assert.equal(getCronSecret({}), null);
  assert.throws(() => getCronSecret({ CRON_SECRET: "short" }));

  assert.equal(
    getCronSecret({
      CRON_SECRET: "1234567890abcdef",
    }),
    "1234567890abcdef",
  );
});

test("cron authorization requires the exact bearer secret", () => {
  const secret = "1234567890abcdef";

  assert.equal(
    isCronAuthorizationValid(`Bearer ${secret}`, secret),
    true,
  );
  assert.equal(
    isCronAuthorizationValid(`bearer ${secret}`, secret),
    false,
  );
  assert.equal(
    isCronAuthorizationValid("Bearer wrong-secret-value", secret),
    false,
  );
  assert.equal(isCronAuthorizationValid(null, secret), false);
});
