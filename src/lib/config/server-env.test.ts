import assert from "node:assert/strict";
import test from "node:test";
import {
  getMigrationEnvironment,
  getOrderApiEnvironment,
  getServerEnvironment,
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
