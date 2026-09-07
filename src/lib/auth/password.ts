import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 32 * 1024 * 1024;

function deriveKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: COST,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
        maxmem: MAX_MEMORY,
      },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyAdminPassword(password: string, encoded: string) {
  const [algorithm, cost, blockSize, parallelization, saltText, keyText] =
    encoded.split("$");
  if (
    algorithm !== "scrypt" ||
    Number(cost) !== COST ||
    Number(blockSize) !== BLOCK_SIZE ||
    Number(parallelization) !== PARALLELIZATION ||
    !saltText ||
    !keyText
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(keyText, "base64url");
    if (expected.length !== KEY_LENGTH) return false;
    const actual = await deriveKey(password, Buffer.from(saltText, "base64url"));
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
