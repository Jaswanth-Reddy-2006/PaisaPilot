import { describe, it, expect } from 'vitest';
import {
  TransactionInputSchema,
  DecisionInputSchema,
  CommitmentInputSchema,
  SavingsGoalInputSchema,
} from './schemas';
import { sanitizeText, sanitizeNumber } from './sanitize';

describe('Security & Data Sanitization', () => {
  describe('Input Sanitization', () => {
    it('should strip dangerous HTML angle brackets from input text', () => {
      const malicious = '<script>alert("hack")</script>Dinner with friends';
      const clean = sanitizeText(malicious);
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
      expect(clean).toBe('scriptalert("hack")/scriptDinner with friends');
    });

    it('should trim surrounding whitespace', () => {
      expect(sanitizeText('   Spotify Subscription   ')).toBe('Spotify Subscription');
    });

    it('should sanitize numbers and clamp within safe bounds', () => {
      expect(sanitizeNumber('1500')).toBe(1500);
      expect(sanitizeNumber('not-a-number', 100)).toBe(100);
      expect(sanitizeNumber(-500, 0, 0, 10000)).toBe(0);
      expect(sanitizeNumber(999999999, 0, 0, 50000)).toBe(50000);
    });
  });

  describe('Zod Validation Schemas', () => {
    it('should accept valid transaction input in paise', () => {
      const result = TransactionInputSchema.safeParse({
        type: 'expense',
        category: 'food',
        amount: 25000, // ₹250
        description: 'Chai & Snacks',
        day: 8,
      });
      expect(result.success).toBe(true);
    });

    it('should reject transactions with negative or zero amounts', () => {
      const result = TransactionInputSchema.safeParse({
        type: 'expense',
        category: 'food',
        amount: -500,
        description: 'Invalid',
        day: 8,
      });
      expect(result.success).toBe(false);
    });

    it('should reject days outside 1-30 boundary', () => {
      const result = TransactionInputSchema.safeParse({
        type: 'expense',
        category: 'food',
        amount: 5000,
        description: 'Test',
        day: 35,
      });
      expect(result.success).toBe(false);
    });

    it('should validate decision input schemas strictly', () => {
      const valid = DecisionInputSchema.safeParse({
        type: 'purchase',
        description: 'Headphones',
        amount: 200000,
        category: 'shopping',
      });
      expect(valid.success).toBe(true);

      const invalid = DecisionInputSchema.safeParse({
        type: 'purchase',
        description: '', // empty description
        amount: 0,
        category: 'shopping',
      });
      expect(invalid.success).toBe(false);
    });
  });
});
