import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeNumber } from './sanitize';
import {
  TransactionInputSchema,
  DecisionInputSchema,
  CommitmentInputSchema,
  SavingsGoalInputSchema,
} from './schemas';

describe('Security, Data Sanitization & Input Boundaries', () => {
  describe('XSS & Dangerous Character Neutralization', () => {
    it('neutralizes nested script tags and attributes', () => {
      const payload = '<<SCRIPT>alert("XSS");//<</SCRIPT>';
      const clean = sanitizeText(payload);
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
      expect(clean).not.toContain('<SCRIPT>');
    });

    it('neutralizes inline event handlers in fake html tags', () => {
      const payload = '<img src=x onerror=alert(1)>Grocery';
      const clean = sanitizeText(payload);
      expect(clean).toBe('img src=x onerror=alert(1)Grocery');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
    });

    it('handles unicode, emojis, and special symbols safely without crashing', () => {
      const text = 'Chai ₹50 at Café ☕ 🎉';
      const clean = sanitizeText(text);
      expect(clean).toContain('Chai ₹50 at Café');
    });

    it('clamps strings to maximum length boundary (150 chars) to prevent buffer exhaustion', () => {
      const longInput = 'A'.repeat(500);
      const clean = sanitizeText(longInput);
      expect(clean.length).toBe(150);
    });

    it('safely handles non-string inputs (null, undefined, numbers)', () => {
      expect(sanitizeText(null as unknown as string)).toBe('');
      expect(sanitizeText(undefined as unknown as string)).toBe('');
      expect(sanitizeText(12345 as unknown as string)).toBe('');
    });
  });

  describe('Numeric Sanitization & Overflow Protection', () => {
    it('clamps numbers below minimum boundary to fallback/min', () => {
      expect(sanitizeNumber(-100, 0, 0, 100000)).toBe(0);
    });

    it('clamps numbers above maximum boundary to max limit', () => {
      expect(sanitizeNumber(999_999_999, 0, 0, 10_000_000)).toBe(10_000_000);
    });

    it('handles NaN, Infinity, -Infinity and string garbage safely', () => {
      expect(sanitizeNumber(NaN, 500)).toBe(500);
      expect(sanitizeNumber(Infinity, 500)).toBe(500);
      expect(sanitizeNumber(-Infinity, 500)).toBe(500);
      expect(sanitizeNumber('undefined', 0)).toBe(0);
      expect(sanitizeNumber('₹1,500', 0)).toBe(0); // non-numeric leading char
    });
  });

  describe('Strict Zod Schema Enforcement', () => {
    it('rejects commitment with missing name or invalid category', () => {
      const invalid = CommitmentInputSchema.safeParse({
        name: '',
        category: 'crypto_gambling', // not an allowed category
        amount: 50000,
        dueDay: 15,
      });
      expect(invalid.success).toBe(false);
    });

    it('rejects savings goal with targetDay outside 1-30 month bounds', () => {
      const invalidDay = SavingsGoalInputSchema.safeParse({
        name: 'Emergency Fund',
        targetAmount: 100000,
        targetDay: 45, // invalid
      });
      expect(invalidDay.success).toBe(false);
    });

    it('rejects savings goal with invalid hex color code', () => {
      const invalidColor = SavingsGoalInputSchema.safeParse({
        name: 'New Bike',
        targetAmount: 500000,
        targetDay: 20,
        color: 'red-alert', // not a 6-digit hex color
      });
      expect(invalidColor.success).toBe(false);
    });
  });
});
