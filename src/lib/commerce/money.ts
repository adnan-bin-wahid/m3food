export function assertMinorAmount(value: number, field = "amount") {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative safe integer.`);
  }
}

export function multiplyMinorAmount(unitPriceMinor: number, quantity: number) {
  assertMinorAmount(unitPriceMinor, "unitPriceMinor");
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError("quantity must be a positive safe integer.");
  }

  const total = unitPriceMinor * quantity;
  assertMinorAmount(total, "totalMinor");
  return total;
}

export function formatMinorAmount(
  value: number,
  currency = "BDT",
  locale = "bn-BD",
) {
  assertMinorAmount(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value / 100);
}
