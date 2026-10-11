import { describe, it, expect } from 'vitest';
import {
  INITIAL_BUDGET_PAISE,
  TOTAL_DAYS,
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  calculateReservedCommitments,
  calculateSpendableBalance,
  calculateSafeDailyAllowance,
  calculateProjectedClosingBalance,
  calculateRiskLevel,
  calculateHealthScore,
  calculateTotalSavings,
  calculateAverageDailySpend,
  calculateMetrics,
  calculateForecast,
  simulateDecision,
} from './calculations';
import { createSeedData } from './seed-data';
import type { FinancialState, Commitment, Subscription, SavingsGoal, Transaction } from '@/types/finance';

describe('Financial Calculation Engine', () => {
  describe('Constants and Conversions', () => {
    it('should have initial budget of ₹10,000 in paise', () => {
      expect(INITIAL_BUDGET_PAISE).toBe(1_000_000);
      expect(paiseToRupees(INITIAL_BUDGET_PAISE)).toBe(10_000);
    });

    it('should convert rupees to paise correctly', () => {
      expect(rupeesToPaise(500)).toBe(50000);
      expect(rupeesToPaise(0)).toBe(0);
      expect(rupeesToPaise(12.5)).toBe(1250);
    });

    it('should format INR currency properly', () => {
      const formatted = formatINR(100000); // ₹1,000
      expect(formatted).toContain('1,000');
    });
  });

  describe('Reserved Commitments & Non-Double-Counting', () => {
    it('should calculate reserved commitments for upcoming bills only', () => {
      const commitments: Commitment[] = [
        {
          id: '1',
          name: 'Rent',
          category: 'rent',
          amount: rupeesToPaise(3500),
          dueDay: 28,
          status: 'upcoming',
          isRecurring: true,
        },
        {
          id: '2',
          name: 'Water Bill',
          category: 'utilities',
          amount: rupeesToPaise(300),
          dueDay: 5,
          status: 'paid', // already paid, should NOT be reserved
          isRecurring: true,
        },
      ];

      const subscriptions: Subscription[] = [
        {
          id: 's1',
          name: 'Spotify',
          amount: rupeesToPaise(119),
          category: 'subscription',
          billingDay: 15,
          isActive: true,
          isPaused: false,
        },
        {
          id: 's2',
          name: 'Gym',
          amount: rupeesToPaise(1500),
          category: 'subscription',
          billingDay: 20,
          isActive: true,
          isPaused: true, // paused, should NOT be reserved
        },
      ];

      // At Day 8:
      // Upcoming: Rent (due 28) = 3500
      // Active subs: Spotify (bills 15) = 119
      // Total reserved = 3619 rupees = 361,900 paise
      const reserved = calculateReservedCommitments(commitments, subscriptions, 8, TOTAL_DAYS);
      expect(reserved).toBe(rupeesToPaise(3619));
    });

    it('should not reserve commitments that were due before current day', () => {
      const commitments: Commitment[] = [
        {
          id: '1',
          name: 'Past Bill',
          category: 'utilities',
          amount: rupeesToPaise(500),
          dueDay: 4,
          status: 'upcoming',
          isRecurring: false,
        },
      ];
      const reserved = calculateReservedCommitments(commitments, [], 8, TOTAL_DAYS);
      expect(reserved).toBe(0);
    });
  });

  describe('Spendable Balance & Safe Daily Allowance', () => {
    it('should calculate spendable balance as currentCash minus reservedCommitments', () => {
      const cash = rupeesToPaise(7000);
      const reserved = rupeesToPaise(3000);
      expect(calculateSpendableBalance(cash, reserved)).toBe(rupeesToPaise(4000));
    });

    it('should not allow spendable balance to be negative', () => {
      const cash = rupeesToPaise(2000);
      const reserved = rupeesToPaise(3000);
      expect(calculateSpendableBalance(cash, reserved)).toBe(0);
    });

    it('should calculate safe daily allowance accurately', () => {
      const spendable = rupeesToPaise(4400); // ₹4,400
      const daysRemaining = 22; // 22 days left
      expect(calculateSafeDailyAllowance(spendable, daysRemaining)).toBe(rupeesToPaise(200));
    });

    it('should handle zero remaining days gracefully without division by zero', () => {
      const spendable = rupeesToPaise(5000);
      expect(calculateSafeDailyAllowance(spendable, 0)).toBe(0);
      expect(calculateSafeDailyAllowance(spendable, -1)).toBe(0);
    });
  });

  describe('Projected Closing Balance & Average Daily Spend', () => {
    it('should calculate average daily spend from past expense transactions', () => {
      const transactions: Transaction[] = [
        { id: '1', type: 'income', category: 'income', amount: rupeesToPaise(10000), description: 'Salary', date: '2024-01-01', day: 1 },
        { id: '2', type: 'expense', category: 'food', amount: rupeesToPaise(700), description: 'Groceries', date: '2024-01-02', day: 2 },
        { id: '3', type: 'expense', category: 'transport', amount: rupeesToPaise(300), description: 'Fuel', date: '2024-01-05', day: 5 },
      ];
      // Total expenses = 1000. At day 6, days passed = 5. Average = 1000 / 5 = 200/day.
      const avg = calculateAverageDailySpend(transactions, 6);
      expect(avg).toBe(rupeesToPaise(200));
    });

    it('should calculate projected closing balance subtracting reserved bills and projected discretionary spend', () => {
      const cash = rupeesToPaise(8000);
      const commitments: Commitment[] = [
        { id: '1', name: 'Rent', category: 'rent', amount: rupeesToPaise(2000), dueDay: 25, status: 'upcoming', isRecurring: true },
      ];
      const subscriptions: Subscription[] = [];
      const currentDay = 10;
      const totalDays = 30;
      const avgDailySpend = rupeesToPaise(100); // 100/day for 20 days = 2000

      // Closing = 8000 - 2000 (rent) - (100 * 20) = 4000
      const closing = calculateProjectedClosingBalance(cash, commitments, subscriptions, currentDay, totalDays, avgDailySpend);
      expect(closing).toBe(rupeesToPaise(4000));
    });
  });

  describe('Risk Level and Financial Health Score', () => {
    it('should flag critical risk when projected balance is negative', () => {
      const { level, factors } = calculateRiskLevel(rupeesToPaise(-1500), rupeesToPaise(4000), rupeesToPaise(2000), 20);
      expect(['critical', 'high']).toContain(level);
      expect(factors.some(f => f.includes('negative'))).toBe(true);
    });

    it('should flag high risk when cash cannot cover upcoming commitments', () => {
      const { factors } = calculateRiskLevel(rupeesToPaise(500), rupeesToPaise(4000), rupeesToPaise(3000), 10);
      expect(factors.some(f => f.includes('cannot cover upcoming commitments'))).toBe(true);
    });

    it('should return health score bounded between 0 and 100', () => {
      const { score: goodScore } = calculateHealthScore(rupeesToPaise(5000), rupeesToPaise(2000), rupeesToPaise(8000), [], 20, 30);
      expect(goodScore).toBeGreaterThanOrEqual(70);
      expect(goodScore).toBeLessThanOrEqual(100);

      const { score: badScore } = calculateHealthScore(rupeesToPaise(-2000), rupeesToPaise(5000), rupeesToPaise(1000), [], 20, 30);
      expect(badScore).toBeLessThan(50);
      expect(badScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Simulation: Non-Mutation and Applying Decisions', () => {
    it('should generate simulated metrics without mutating the original state', () => {
      const originalState = createSeedData();
      const initialCash = originalState.currentCash;
      const initialSpent = originalState.totalSpent;

      const preview = simulateDecision(originalState, {
        type: 'purchase',
        amount: rupeesToPaise(2000),
        category: 'shopping',
        description: 'Noise Cancelling Headphones',
      });

      // Original state must NOT have changed
      expect(originalState.currentCash).toBe(initialCash);
      expect(originalState.totalSpent).toBe(initialSpent);

      // Simulated metrics must reflect the ₹2,000 purchase
      expect(preview.simulated.currentCash).toBe(initialCash - rupeesToPaise(2000));
      expect(preview.deltas.balance).toBe(-rupeesToPaise(2000));
      expect(preview.simulated.safeDailyAllowance).toBeLessThan(preview.current.safeDailyAllowance);
    });

    it('should simulate additional income increasing balance and daily allowance', () => {
      const state = createSeedData();
      const preview = simulateDecision(state, {
        type: 'income',
        amount: rupeesToPaise(2000),
        category: 'income',
        description: 'Freelance Design Gig',
      });

      expect(preview.deltas.balance).toBe(rupeesToPaise(2000));
      expect(preview.simulated.safeDailyAllowance).toBeGreaterThan(preview.current.safeDailyAllowance);
      expect(preview.simulated.healthScore).toBeGreaterThanOrEqual(preview.current.healthScore);
    });

    it('should treat savings contributions as transfers and not count them as consumption spend', () => {
      const state = createSeedData();
      const preview = simulateDecision(state, {
        type: 'savings',
        amount: rupeesToPaise(500),
        category: 'savings',
        description: 'Deposit to Emergency Fund',
      });

      // Cash drops by ₹500
      expect(preview.deltas.balance).toBe(-rupeesToPaise(500));
      // Savings total increases
      expect(preview.simulated.totalSavings).toBe(preview.current.totalSavings + rupeesToPaise(500));
      // Savings progress increases
      expect(preview.deltas.savingsProgress).toBeGreaterThan(0);
    });
  });

  describe('30-Day Forecast Engine', () => {
    it('should generate exactly 30 daily forecast points', () => {
      const state = createSeedData();
      const forecast = calculateForecast(state);
      expect(forecast).toHaveLength(30);
      expect(forecast[0].day).toBe(1);
      expect(forecast[29].day).toBe(30);
    });

    it('should mark past/current days as actual and future days as projected', () => {
      const state = createSeedData(); // currentDay is 8
      const forecast = calculateForecast(state);

      expect(forecast[0].isProjected).toBe(false); // Day 1
      expect(forecast[7].isProjected).toBe(false); // Day 8 (current)
      expect(forecast[8].isProjected).toBe(true);  // Day 9 (future)
      expect(forecast[29].isProjected).toBe(true); // Day 30 (future)
    });
  });
});
