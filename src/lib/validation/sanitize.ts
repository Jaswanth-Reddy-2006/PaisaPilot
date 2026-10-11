/**
 * Security & Data Sanitization utilities
 * Protects financial records against injection, corrupted inputs, and XSS.
 */

export function sanitizeText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/[<>]/g, '') // Strip angle brackets
    .slice(0, 150); // Enforce upper length boundary
}

export function sanitizeNumber(
  val: unknown,
  fallback = 0,
  min = 0,
  max = 100_000_000
): number {
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}
