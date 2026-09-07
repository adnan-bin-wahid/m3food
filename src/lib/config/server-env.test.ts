import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdminAuthEnvironment,
  getMarketingEnvironment,
  getMarketingPreferenceSecret,
  getMigrationEnvironment,
  getOrderApiEnvironment,
  getServerEnvironment,
  getSteadfastEnvironment,
} from "./server-env";

test("a PostgreSQL connection URL is accepted", () => {
  const environment = getServerEnvironment({
    DATABASE_URL: "postgresql://user:password@example.com/database?sslmode=require",
  });

  assert.equal(
    environment.DATABASE_URL,
    "postgresql://user:password@example.com/database?sslmode=require",
  );
});

test("admin authentication requires a separate server-only session secret", () => {
  const environment = getAdminAuthEnvironment({
    DATABASE_URL: "postgresql://user:password@example.com/database",
    RATE_LIMIT_SALT: "a-secure-random-value-with-at-least-32-characters",
    ADMIN_SESSION_SECRET:
      "a-different-secure-session-secret-with-at-least-32-characters",
  });

  assert.ok(environment.ADMIN_SESSION_SECRET.length >= 32);
  assert.throws(
    () =>
      getAdminAuthEnvironment({
        DATABASE_URL: "postgresql://user:password@example.com/database",
        RATE_LIMIT_SALT: "a-secure-random-value-with-at-least-32-characters",
      }),
    /ADMIN_SESSION_SECRET/,
  );
});

test("migration credentials are separate from runtime credentials", () => {
  assert.equal(
    getMigrationEnvironment({
      MIGRATION_DATABASE_URL:
        "postgresql://user:password@example.com:5432/database",
    }).MIGRATION_DATABASE_URL,
    "postgresql://user:password@example.com:5432/database",
  );
  assert.throws(() => getMigrationEnvironment({}), /MIGRATION_DATABASE_URL/);
});

test("missing and non-PostgreSQL connection URLs are rejected", () => {
  assert.throws(() => getServerEnvironment({}), /DATABASE_URL/);
  assert.throws(
    () => getServerEnvironment({ DATABASE_URL: "https://example.com/database" }),
    /postgres:\/\//,
  );
});

test("the order API requires a server-only rate-limit salt", () => {
  const environment = getOrderApiEnvironment({
    DATABASE_URL: "postgresql://user:password@example.com/database",
    RATE_LIMIT_SALT: "a-secure-random-value-with-at-least-32-characters",
  });

  assert.ok(environment.RATE_LIMIT_SALT.length >= 32);
  assert.throws(
    () =>
      getOrderApiEnvironment({
        DATABASE_URL: "postgresql://user:password@example.com/database",
        RATE_LIMIT_SALT: "too-short",
      }),
    /RATE_LIMIT_SALT/,
  );
});


test("Meta CAPI credentials are optional but must be configured as a pair", () => {
  assert.deepEqual(getMarketingEnvironment({}), {});
  const configured = getMarketingEnvironment({
    META_CAPI_ACCESS_TOKEN: "server-only-token",
    META_GRAPH_API_VERSION: "v99.0",
  });
  assert.equal(configured.META_CAPI_ACCESS_TOKEN, "server-only-token");
  assert.equal(configured.META_GRAPH_API_VERSION, "v99.0");
  assert.throws(
    () => getMarketingEnvironment({ META_CAPI_ACCESS_TOKEN: "server-only-token" }),
    /configured together/,
  );
});


test("Steadfast credentials are optional but must be configured as a pair", () => {
  const empty = getSteadfastEnvironment({});
  assert.equal(empty.STEADFAST_BASE_URL, "https://portal.packzy.com/api/v1");
  const configured = getSteadfastEnvironment({
    STEADFAST_API_KEY: "server-api-key",
    STEADFAST_SECRET_KEY: "server-secret-key",
  });
  assert.equal(configured.STEADFAST_API_KEY, "server-api-key");
  assert.throws(
    () => getSteadfastEnvironment({ STEADFAST_API_KEY: "server-api-key" }),
    /configured together/,
  );
});


test("marketing preference links use a dedicated secret when configured and otherwise fall back safely", () => {
  const base = {
    DATABASE_URL: "postgresql://user:password@example.com/database",
    RATE_LIMIT_SALT: "a-secure-random-value-with-at-least-32-characters",
  };
  assert.equal(getMarketingPreferenceSecret(base), base.RATE_LIMIT_SALT);
  assert.equal(getMarketingPreferenceSecret({ ...base, MARKETING_PREFERENCE_SECRET: "stable-preference-secret" }), "stable-preference-secret");
});
