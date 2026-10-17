export function isValidTargetPrice(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 99_999_999.99) return false;
  return Math.abs(Math.round(value * 100) - value * 100) < Number.EPSILON * 1000;
}
