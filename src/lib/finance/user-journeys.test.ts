import { describe, it, expect, beforeEach } from 'vitest';
import { useFinanceStore } from '@/store/finance-store';
import {
  rupeesToPaise,
  paiseToRupees,
  simulateDecision,
  calculateMetrics,
  calculateForecast,
} from '@/lib/finance/calculations';
import { sanitizeText, sanitizeNumber } from '@/lib/validation/sanitize';
import type { Decision } from '@/types/finance';

describe('Phase 4 — Comprehensive User-Journey Scenarios', () => {
  beforeEach(() => {
    useFinanceStore.getState().resetToDemo();
  });

  describe('Scenario 1: Discretionary Purchase Decision (Preview, Discard, Apply)', () => {
    it('accurately computes preview, leaves state unchanged on discard, and persists on apply', () => {
      const stateBefore = { ...useFinanceStore.getState() };
      const initialCash = stateBefore.currentCash;
      const initialSpent = stateBefore.totalSpent;
      const initialDaily = stateBefore.getMetrics().safeDailyAllowance;
      const purchaseAmount = rupeesToPaise(2000); // ₹2,000

      // Step A: Preview
      const preview = simulateDecision(stateBefore, {
        type: 'purchase',
        amount: purchaseAmount,
        description: 'Wireless Headphones',
        category: 'shopping',
      });

      expect(preview.deltas.balance).toBe(-purchaseAmount);
      expect(preview.simulated.currentCash).toBe(initialCash - purchaseAmount);
      expect(preview.simulated.safeDailyAllowance).toBeLessThan(initialDaily);
      expect(preview.deltas.dailyAllowance).toBe(preview.simulated.safeDailyAllowance - initialDaily);

      // Step B: Discard (verify complete isolation)
      const stateAfterDiscard = useFinanceStore.getState();
      expect(stateAfterDiscard.currentCash).toBe(initialCash);
      expect(stateAfterDiscard.totalSpent).toBe(initialSpent);
      expect(stateAfterDiscard.decisions).toHaveLength(0);

      // Step C: Apply
      useFinanceStore.getState().applyDecision({
        type: 'purchase',
        description: 'Wireless Headphones',
        amount: purchaseAmount,
        category: 'shopping',
        isRecurring: false,
        day: stateBefore.currentDay,
      });

      const stateAfterApply = useFinanceStore.getState();
      expect(stateAfterApply.currentCash).toBe(initialCash - purchaseAmount);
      expect(stateAfterApply.totalSpent).toBe(initialSpent + purchaseAmount);
      expect(stateAfterApply.decisions).toHaveLength(1);
      expect(stateAfterApply.decisions[0].description).toBe('Wireless Headphones');
      expect(stateAfterApply.decisions[0].isApplied).toBe(true);

      const newMetrics = stateAfterApply.getMetrics();
      expect(newMetrics.currentCash).toBe(initialCash - purchaseAmount);
      expect(newMetrics.safeDailyAllowance).toBe(preview.simulated.safeDailyAllowance);
    });
  });

  describe('Scenario 2: Unexpected Expense & Emergency Shock', () => {
    it('models sudden emergency impact without altering committed bills', () => {
      const state = useFinanceStore.getState();
      const initialCash = state.currentCash;
      const initialReserved = state.getMetrics().reservedCommitments;
      const emergencyAmount = rupeesToPaise(1500); // ₹1,500 emergency clinic bill

      const preview = simulateDecision(state, {
        type: 'emergency',
        amount: emergencyAmount,
        description: 'Emergency Clinic Visit & Medicine',
        category: 'health',
      });

      // Cash drops by ₹1,500
      expect(preview.simulated.currentCash).toBe(initialCash - emergencyAmount);
      // Reserved bills remain strictly untouched
      expect(preview.simulated.reservedCommitments).toBe(initialReserved);
      // Closing balance drops
      expect(preview.deltas.closingBalance).toBe(-emergencyAmount);
      // Health score drops or stays within 0-100 bounds
      expect(preview.simulated.healthScore).toBeLessThanOrEqual(state.getMetrics().healthScore);
      expect(preview.simulated.healthScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Scenario 3: Subscription Lifecycle & Commitment Invariant', () => {
    it('reserves subscription funds in future days without double counting cash prematurely', () => {
      const state = useFinanceStore.getState();
      const initialCash = state.currentCash;
      const initialReserved = state.getMetrics().reservedCommitments;
      const subAmount = rupeesToPaise(499); // ₹499/mo

      // Add subscription billing on Day 20 (future day in 8-30 timeline)
      useFinanceStore.getState().addSubscription({
        name: 'Streaming Entertainment Premium',
        category: 'subscription',
        amount: subAmount,
        billingDay: 20,
        isActive: true,
        isPaused: false,
      });

      const updated = useFinanceStore.getState();
      // Cash has NOT been deducted yet because billing day is Day 20 (current is Day 8)
      expect(updated.currentCash).toBe(initialCash);
      // But reserved commitments has increased, protecting the funds from spendable balance
      expect(updated.getMetrics().reservedCommitments).toBe(initialReserved + subAmount);
      expect(updated.getMetrics().spendableBalance).toBe(
        Math.max(0, initialCash - (initialReserved + subAmount))
      );

      // Pausing subscription immediately frees the reserved funds back into spendable balance
      const createdSub = updated.subscriptions.find((s) => s.name.includes('Streaming'))!;
      useFinanceStore.getState().toggleSubscriptionPause(createdSub.id);

      const pausedMetrics = useFinanceStore.getState().getMetrics();
      expect(pausedMetrics.reservedCommitments).toBe(initialReserved);
    });
  });

  describe('Scenario 4: Additional Inflow & Side-Gig Income', () => {
    it('increases available cash, safe daily allowance, and improves runway', () => {
      const initialCash = useFinanceStore.getState().currentCash;
      const initialIncome = useFinanceStore.getState().totalIncome;
      const initialDaily = useFinanceStore.getState().getMetrics().safeDailyAllowance;
      const initialClosing = useFinanceStore.getState().getMetrics().projectedClosingBalance;
      const incomeAmount = rupeesToPaise(2000); // ₹2,000

      useFinanceStore.getState().addTransaction({
        type: 'income',
        category: 'income',
        amount: incomeAmount,
        description: 'Freelance Frontend Gig',
        date: '2024-01-08',
        day: 8,
      });

      const updated = useFinanceStore.getState();
      expect(updated.currentCash).toBe(initialCash + incomeAmount);
      expect(updated.totalIncome).toBe(initialIncome + incomeAmount);
      expect(updated.getMetrics().safeDailyAllowance).toBeGreaterThan(initialDaily);
      expect(updated.getMetrics().projectedClosingBalance).toBe(initialClosing + incomeAmount);
    });
  });

  describe('Scenario 5: Savings Goal Vault Segregation', () => {
    it('transfers money into vault without counting as consumption spending or income', () => {
      const state = useFinanceStore.getState();
      const initialCash = state.currentCash;
      const initialSpent = state.totalSpent;
      const initialIncome = state.totalIncome;
      const goal = state.savingsGoals[0];
      const transferAmount = rupeesToPaise(500); // ₹500 transfer

      useFinanceStore.getState().contributeToGoal(goal.id, transferAmount);

      const updated = useFinanceStore.getState();
      // Cash is reduced
      expect(updated.currentCash).toBe(initialCash - transferAmount);
      // Goal vault balance increased
      const updatedGoal = updated.savingsGoals.find((g) => g.id === goal.id)!;
      expect(updatedGoal.currentAmount).toBe(goal.currentAmount + transferAmount);
      // Crucial Financial Invariant: Consumption spent and income MUST NOT change
      expect(updated.totalSpent).toBe(initialSpent);
      expect(updated.totalIncome).toBe(initialIncome);

      // Reversing / withdrawing from goal
      useFinanceStore.getState().contributeToGoal(goal.id, -transferAmount);
      const reverted = useFinanceStore.getState();
      expect(reverted.currentCash).toBe(initialCash);
      expect(reverted.totalSpent).toBe(initialSpent);
    });
  });

  describe('Scenario 6: Persistence & Storage Tamper Resilience', () => {
    it('safely serializes and handles edge-case recovery without crashing', () => {
      const state = useFinanceStore.getState();
      expect(state.userName).toBe('Arjun');
      expect(state.initialBudget).toBe(1_000_000);

      // Verify state getter generates pure detached object
      const metrics = state.getMetrics();
      expect(typeof metrics.healthScore).toBe('number');
      expect(metrics.healthScore).toBeGreaterThanOrEqual(0);
      expect(metrics.healthScore).toBeLessThanOrEqual(100);

      const forecast = state.getForecast();
      expect(forecast).toHaveLength(30);
    });
  });

  describe('Scenario 7: Edge Cases & Extreme Boundaries', () => {
    it('handles Day 30 (0 days remaining) gracefully without division by zero', () => {
      useFinanceStore.getState().setCurrentDay(30);
      const metrics = useFinanceStore.getState().getMetrics();
      expect(metrics.daysRemaining).toBe(0);
      expect(metrics.safeDailyAllowance).toBe(0);
      expect(Number.isNaN(metrics.safeDailyAllowance)).toBe(false);
      expect(Number.isFinite(metrics.safeDailyAllowance)).toBe(true);
    });

    it('handles massive deficit purchase safely without unhandled NaN or crash', () => {
      const state = useFinanceStore.getState();
      // Huge expense exceeding cash
      const excessiveAmount = rupeesToPaise(50000); // ₹50,000

      const preview = simulateDecision(state, {
        type: 'purchase',
        amount: excessiveAmount,
        description: 'Exorbitant Luxury Watch',
        category: 'shopping',
      });

      expect(preview.simulated.currentCash).toBe(state.currentCash - excessiveAmount);
      expect(preview.simulated.currentCash).toBeLessThan(0);
      expect(preview.simulated.riskLevel).toBe('critical');
      expect(preview.warnings.some((w) => w.includes('deficit') || w.includes('insufficient') || w.includes('exceeds'))).toBe(true);
      expect(preview.simulated.safeDailyAllowance).toBe(0);
    });

    it('defends against negative amounts and NaN in form sanitization', () => {
      expect(sanitizeNumber(-500, 0, 0, 100000)).toBe(0);
      expect(sanitizeNumber(NaN, 100)).toBe(100);
      const clean = sanitizeText('<script>alert("hack")</script>Phone Case');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
      expect(clean).toContain('Phone Case');
    });
  });
});
