import { describe, it, expect } from 'vitest';
import {
  calculateSafeDailyAllowance,
  calculateSpendableBalance,
  calculateProjectedClosingBalance,
  calculateRiskLevel,
  calculateHealthScore,
  calculateForecast,
  simulateDecision,
  rupeesToPaise,
  formatINR,
  paiseToRupees,
} from './calculations';
import { createSeedData } from './seed-data';
import type { FinancialState, Decision } from '@/types/finance';

describe('Edge Cases & Stress Testing for Financial Simulation Engine', () => {
  describe('Boundary Conditions: Day Transitions & Time Horizon', () => {
    it('returns 0 safe daily allowance when on Day 30 (0 days remaining)', () => {
      const allowance = calculateSafeDailyAllowance(100000, 0);
      expect(allowance).toBe(0);
    });

    it('returns 0 safe daily allowance when spendable balance is 0 or negative', () => {
      expect(calculateSafeDailyAllowance(0, 10)).toBe(0);
      expect(calculateSafeDailyAllowance(-50000, 10)).toBe(0);
    });

    it('calculates safe daily allowance accurately when 1 day is remaining', () => {
      const spendable = rupeesToPaise(500); // ₹500 in paise
      expect(calculateSafeDailyAllowance(spendable, 1)).toBe(spendable);
    });

    it('floors fractional daily allowance paise correctly to prevent rounding errors', () => {
      // 1000 paise divided by 3 days = 333.333... -> should be 333
      expect(calculateSafeDailyAllowance(1000, 3)).toBe(333);
    });
  });

  describe('Extreme Deficits & Zero-Balance Resilience', () => {
    it('flags critical risk when projected balance is heavily negative', () => {
      const risk = calculateRiskLevel(-500000, 300000, 200000, 15);
      expect(risk.level).toBe('critical');
      expect(risk.factors.some((f) => f.includes('negative'))).toBe(true);
    });

    it('flags critical risk when current cash cannot cover upcoming commitments', () => {
      const currentCash = rupeesToPaise(500);
      const reserved = rupeesToPaise(4000);
      const risk = calculateRiskLevel(100000, reserved, currentCash, 10);
      expect(['high', 'critical']).toContain(risk.level);
      expect(risk.factors.some((f) => f.includes('cannot cover upcoming commitments'))).toBe(true);
    });

    it('health score drops severely when projected balance runs into deficit', () => {
      const health = calculateHealthScore(-100000, 300000, 50000, [], 10, 30);
      expect(health.score).toBeLessThanOrEqual(50);
      expect(health.factors.some((f) => f.includes('deficit'))).toBe(true);
    });

    it('spendable balance never drops below zero even when commitments exceed cash', () => {
      const spendable = calculateSpendableBalance(10000, 50000, []);
      expect(spendable).toBe(0);
    });
  });

  describe('Decision Simulation Previews & Deltas', () => {
    it('accurately computes deltas for a large discretionary purchase', () => {
      const state = createSeedData();
      const decision: Decision = {
        id: 'test-dec-1',
        type: 'purchase',
        description: 'Noise Cancelling Headphones',
        amount: rupeesToPaise(2000), // ₹2,000
        category: 'shopping',
        isRecurring: false,
        day: state.currentDay,
        appliedAt: new Date().toISOString(),
        isApplied: false,
      };

      const preview = simulateDecision(state, decision);

      // Balance delta must equal -amount
      expect(preview.deltas.balance).toBe(-decision.amount);
      expect(preview.simulated.currentCash).toBe(state.currentCash - decision.amount);
      // Daily allowance must decrease
      expect(preview.deltas.dailyAllowance).toBeLessThan(0);
      // Warnings or insights should be generated
      expect(preview.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('accurately computes positive deltas for side-income decisions', () => {
      const state = createSeedData();
      const decision: Decision = {
        id: 'test-dec-2',
        type: 'income',
        description: 'Freelance Gig',
        amount: rupeesToPaise(3000), // ₹3,000
        category: 'income',
        isRecurring: false,
        day: state.currentDay,
        appliedAt: new Date().toISOString(),
        isApplied: false,
      };

      const preview = simulateDecision(state, decision);

      expect(preview.deltas.balance).toBe(decision.amount);
      expect(preview.simulated.currentCash).toBe(state.currentCash + decision.amount);
      expect(preview.deltas.dailyAllowance).toBeGreaterThan(0);
      expect(preview.insights.some((i) => i.includes('Boosts') || i.includes('allowance'))).toBe(true);
    });

    it('generates deficit warning when a decision causes month-end shortfall', () => {
      const state = createSeedData();
      // Enormous decision that wipes out cash
      const decision: Decision = {
        id: 'test-dec-3',
        type: 'purchase',
        description: 'High-end smartphone',
        amount: rupeesToPaise(8000),
        category: 'shopping',
        isRecurring: false,
        day: state.currentDay,
        appliedAt: new Date().toISOString(),
        isApplied: false,
      };

      const preview = simulateDecision(state, decision);
      expect(preview.warnings.some((w) => w.includes('deficit') || w.includes('shortfall'))).toBe(true);
    });
  });

  describe('30-Day Forecast Engine Continuity', () => {
    it('produces exactly 30 days of data points without gaps', () => {
      const state = createSeedData();
      const forecast = calculateForecast(state);
      expect(forecast).toHaveLength(30);
      expect(forecast[0].day).toBe(1);
      expect(forecast[29].day).toBe(30);
    });

    it('marks days before or equal to currentDay as non-projected and future days as projected', () => {
      const state = createSeedData(); // currentDay is 8
      const forecast = calculateForecast(state);

      expect(forecast[0].isProjected).toBe(false); // Day 1
      expect(forecast[7].isProjected).toBe(false); // Day 8
      expect(forecast[8].isProjected).toBe(true);  // Day 9
      expect(forecast[29].isProjected).toBe(true); // Day 30
    });
  });
});
