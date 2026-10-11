import { describe, it, expect, beforeEach } from 'vitest';
import { useFinanceStore } from './finance-store';
import { rupeesToPaise, simulateDecision } from '@/lib/finance/calculations';

describe('Finance Store State Management', () => {
  beforeEach(() => {
    // Reset to demo state before each test
    useFinanceStore.getState().resetToDemo();
  });

  it('should initialize with Day 8 and ₹10,000 budget', () => {
    const state = useFinanceStore.getState();
    expect(state.currentDay).toBe(8);
    expect(state.totalDays).toBe(30);
    expect(state.initialBudget).toBe(1_000_000);
    expect(state.userName).toBe('Arjun');
    expect(state.isDemoMode).toBe(true);
  });

  it('should reduce available cash when adding an expense', () => {
    const initialCash = useFinanceStore.getState().currentCash;
    const initialSpent = useFinanceStore.getState().totalSpent;
    const amount = rupeesToPaise(500);

    useFinanceStore.getState().addTransaction({
      type: 'expense',
      category: 'food',
      amount,
      description: 'Team Dinner',
      date: '2024-01-08',
      day: 8,
    });

    const newState = useFinanceStore.getState();
    expect(newState.currentCash).toBe(initialCash - amount);
    expect(newState.totalSpent).toBe(initialSpent + amount);
  });

  it('should increase available cash when adding income', () => {
    const initialCash = useFinanceStore.getState().currentCash;
    const initialIncome = useFinanceStore.getState().totalIncome;
    const amount = rupeesToPaise(1500);

    useFinanceStore.getState().addTransaction({
      type: 'income',
      category: 'income',
      amount,
      description: 'Tutoring Gig',
      date: '2024-01-08',
      day: 8,
    });

    const newState = useFinanceStore.getState();
    expect(newState.currentCash).toBe(initialCash + amount);
    expect(newState.totalIncome).toBe(initialIncome + amount);
  });

  it('should mark commitment paid without double-counting', () => {
    const state = useFinanceStore.getState();
    const unpaidCommitment = state.commitments.find(c => c.status === 'upcoming')!;
    const initialCash = state.currentCash;
    const initialReserved = state.getMetrics().reservedCommitments;

    useFinanceStore.getState().markCommitmentPaid(unpaidCommitment.id);

    const updated = useFinanceStore.getState();
    const updatedCommitment = updated.commitments.find(c => c.id === unpaidCommitment.id)!;

    // Status changed to paid
    expect(updatedCommitment.status).toBe('paid');
    // Cash reduced by paid amount
    expect(updated.currentCash).toBe(initialCash - unpaidCommitment.amount);
    // Reserved commitments decreased (no longer reserved)
    expect(updated.getMetrics().reservedCommitments).toBe(initialReserved - unpaidCommitment.amount);
  });

  it('should pause and resume subscriptions correctly', () => {
    const state = useFinanceStore.getState();
    const sub = state.subscriptions[0];
    const initialReserved = state.getMetrics().reservedCommitments;

    // Pause subscription
    useFinanceStore.getState().toggleSubscriptionPause(sub.id);
    let metrics = useFinanceStore.getState().getMetrics();
    expect(metrics.reservedCommitments).toBe(initialReserved - sub.amount);

    // Unpause subscription
    useFinanceStore.getState().toggleSubscriptionPause(sub.id);
    metrics = useFinanceStore.getState().getMetrics();
    expect(metrics.reservedCommitments).toBe(initialReserved);
  });

  it('should apply a simulation decision into active state', () => {
    const initialCash = useFinanceStore.getState().currentCash;
    const decisionAmount = rupeesToPaise(2000);

    useFinanceStore.getState().applyDecision({
      type: 'purchase',
      description: 'Gaming Mouse',
      amount: decisionAmount,
      category: 'shopping',
      isRecurring: false,
      day: 8,
    });

    const state = useFinanceStore.getState();
    expect(state.currentCash).toBe(initialCash - decisionAmount);
    expect(state.decisions).toHaveLength(1);
    expect(state.decisions[0].description).toBe('Gaming Mouse');
    expect(state.decisions[0].isApplied).toBe(true);
  });

  it('should advance and set current day safely between 1 and 30', () => {
    useFinanceStore.getState().setCurrentDay(15);
    expect(useFinanceStore.getState().currentDay).toBe(15);

    // Clamp to 30
    useFinanceStore.getState().setCurrentDay(99);
    expect(useFinanceStore.getState().currentDay).toBe(30);

    // Clamp to 1
    useFinanceStore.getState().setCurrentDay(-5);
    expect(useFinanceStore.getState().currentDay).toBe(1);
  });

  it('should reset to initial demo state completely', () => {
    useFinanceStore.getState().setCurrentDay(25);
    useFinanceStore.getState().addTransaction({
      type: 'expense',
      category: 'entertainment',
      amount: rupeesToPaise(5000),
      description: 'Concert',
      date: '2024-01-25',
      day: 25,
    });

    useFinanceStore.getState().resetToDemo();
    const reset = useFinanceStore.getState();
    expect(reset.currentDay).toBe(8);
    expect(reset.decisions).toHaveLength(0);
  });

  it('should preserve state isolation when simulating decisions before applying', () => {
    const stateBefore = { ...useFinanceStore.getState() };
    const preview = simulateDecision(stateBefore, {
      type: 'emergency',
      amount: rupeesToPaise(1500),
      description: 'Unexpected Dental Bill',
      category: 'health',
    });

    // Preview returned expected simulated deltas
    expect(preview.deltas.balance).toBe(-rupeesToPaise(1500));

    // Store state must remain 100% untouched
    const stateAfter = useFinanceStore.getState();
    expect(stateAfter.currentCash).toBe(stateBefore.currentCash);
    expect(stateAfter.totalSpent).toBe(stateBefore.totalSpent);
    expect(stateAfter.decisions).toHaveLength(stateBefore.decisions.length);
  });

  it('should strictly isolate savings transfers from income and discretionary spend', () => {
    const goal = useFinanceStore.getState().savingsGoals[0];
    const initialCash = useFinanceStore.getState().currentCash;
    const initialSpent = useFinanceStore.getState().totalSpent;
    const initialIncome = useFinanceStore.getState().totalIncome;
    const transferAmount = rupeesToPaise(400);

    useFinanceStore.getState().contributeToGoal(goal.id, transferAmount);

    const updated = useFinanceStore.getState();
    expect(updated.currentCash).toBe(initialCash - transferAmount);
    // Discretionary spent and total income must NOT increase from savings vault transfers
    expect(updated.totalSpent).toBe(initialSpent);
    expect(updated.totalIncome).toBe(initialIncome);
    expect(updated.savingsGoals[0].currentAmount).toBe(goal.currentAmount + transferAmount);
  });

  it('should handle Day 30 boundary condition safely with zero division protection', () => {
    useFinanceStore.getState().setCurrentDay(30);
    const metrics = useFinanceStore.getState().getMetrics();
    expect(metrics.daysRemaining).toBe(0);
    expect(metrics.safeDailyAllowance).toBe(0);
    expect(Number.isFinite(metrics.safeDailyAllowance)).toBe(true);
  });
});
