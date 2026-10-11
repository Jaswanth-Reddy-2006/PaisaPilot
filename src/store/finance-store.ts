import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FinancialState, Transaction, Commitment, Subscription, SavingsGoal, Decision } from '@/types/finance';
import { createSeedData } from '@/lib/finance/seed-data';
import { calculateMetrics, calculateForecast, generateInsights } from '@/lib/finance/calculations';

interface FinanceStore extends FinancialState {
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addCommitment: (c: Omit<Commitment, 'id'>) => void;
  updateCommitment: (id: string, updates: Partial<Commitment>) => void;
  deleteCommitment: (id: string) => void;
  markCommitmentPaid: (id: string) => void;

  addSubscription: (s: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscriptionPause: (id: string) => void;

  addSavingsGoal: (g: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;

  applyDecision: (decision: Omit<Decision, 'id' | 'appliedAt' | 'isApplied'>) => void;

  setCurrentDay: (day: number) => void;
  resetToDemo: () => void;
  setUserName: (name: string) => void;

  // Computed getters
  getMetrics: () => ReturnType<typeof calculateMetrics>;
  getForecast: () => ReturnType<typeof calculateForecast>;
  getInsights: () => string[];
}

function uid(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function recalcCash(transactions: Transaction[]): { currentCash: number; totalSpent: number; totalIncome: number } {
  const currentCash = transactions.reduce((cash, t) => {
    if (t.type === 'income') return cash + t.amount;
    if (t.type === 'expense') return cash - t.amount;
    return cash;
  }, 0);
  const totalSpent = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  return { currentCash, totalSpent, totalIncome };
}

function getFinancialState(store: FinanceStore): FinancialState {
  return {
    initialBudget: store.initialBudget,
    currentDay: store.currentDay,
    totalDays: store.totalDays,
    currentCash: store.currentCash,
    totalIncome: store.totalIncome,
    totalSpent: store.totalSpent,
    transactions: store.transactions,
    commitments: store.commitments,
    subscriptions: store.subscriptions,
    savingsGoals: store.savingsGoals,
    decisions: store.decisions,
    userName: store.userName,
    isDemoMode: store.isDemoMode,
  };
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      ...createSeedData(),

      addTransaction: (tx) => set((state) => {
        const newTx: Transaction = { ...tx, id: uid() };
        const transactions = [...state.transactions, newTx];
        return { transactions, ...recalcCash(transactions) };
      }),

      updateTransaction: (id, updates) => set((state) => {
        const transactions = state.transactions.map(t => t.id === id ? { ...t, ...updates } : t);
        return { transactions, ...recalcCash(transactions) };
      }),

      deleteTransaction: (id) => set((state) => {
        const transactions = state.transactions.filter(t => t.id !== id);
        return { transactions, ...recalcCash(transactions) };
      }),

      addCommitment: (c) => set((state) => ({
        commitments: [...state.commitments, { ...c, id: uid() }],
      })),

      updateCommitment: (id, updates) => set((state) => ({
        commitments: state.commitments.map(c => c.id === id ? { ...c, ...updates } : c),
      })),

      deleteCommitment: (id) => set((state) => ({
        commitments: state.commitments.filter(c => c.id !== id),
      })),

      markCommitmentPaid: (id) => set((state) => {
        const commitment = state.commitments.find(c => c.id === id);
        if (!commitment) return state;
        const tx: Transaction = {
          id: uid(),
          type: 'expense',
          category: commitment.category,
          amount: commitment.amount,
          description: `${commitment.name} (paid)`,
          date: new Date().toISOString().split('T')[0],
          day: state.currentDay,
        };
        const transactions = [...state.transactions, tx];
        return {
          commitments: state.commitments.map(c => c.id === id ? { ...c, status: 'paid' as const } : c),
          transactions,
          ...recalcCash(transactions),
        };
      }),

      addSubscription: (s) => set((state) => ({
        subscriptions: [...state.subscriptions, { ...s, id: uid() }],
      })),

      updateSubscription: (id, updates) => set((state) => ({
        subscriptions: state.subscriptions.map(s => s.id === id ? { ...s, ...updates } : s),
      })),

      deleteSubscription: (id) => set((state) => ({
        subscriptions: state.subscriptions.filter(s => s.id !== id),
      })),

      toggleSubscriptionPause: (id) => set((state) => ({
        subscriptions: state.subscriptions.map(s =>
          s.id === id ? { ...s, isPaused: !s.isPaused } : s
        ),
      })),

      addSavingsGoal: (g) => set((state) => ({
        savingsGoals: [...state.savingsGoals, { ...g, id: uid() }],
      })),

      updateSavingsGoal: (id, updates) => set((state) => ({
        savingsGoals: state.savingsGoals.map(g => g.id === id ? { ...g, ...updates } : g),
      })),

      deleteSavingsGoal: (id) => set((state) => ({
        savingsGoals: state.savingsGoals.filter(g => g.id !== id),
      })),

      contributeToGoal: (id, amount) => set((state) => {
        const goal = state.savingsGoals.find(g => g.id === id);
        if (!goal) return state;
        const tx: Transaction = {
          id: uid(),
          type: 'transfer',
          category: 'savings',
          amount: Math.abs(amount),
          description: `Savings: ${goal.name}`,
          date: new Date().toISOString().split('T')[0],
          day: state.currentDay,
        };
        const transactions = amount > 0 ? [...state.transactions, tx] : state.transactions;
        return {
          savingsGoals: state.savingsGoals.map(g =>
            g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) } : g
          ),
          transactions,
          currentCash: state.currentCash - amount,
          totalSpent: amount > 0 ? state.totalSpent + amount : state.totalSpent,
          totalIncome: state.totalIncome,
        };
      }),

      applyDecision: (decision) => set((state) => {
        const d: Decision = {
          ...decision,
          id: uid(),
          appliedAt: new Date().toISOString(),
          isApplied: true,
        };
        const tx: Transaction = {
          id: uid(),
          type: decision.type === 'income' ? 'income' : 'expense',
          category: decision.category,
          amount: decision.amount,
          description: decision.description,
          date: new Date().toISOString().split('T')[0],
          day: state.currentDay,
        };
        const transactions = [...state.transactions, tx];
        return {
          decisions: [...state.decisions, d],
          transactions,
          ...recalcCash(transactions),
        };
      }),

      setCurrentDay: (day) => set({ currentDay: Math.max(1, Math.min(30, day)) }),

      resetToDemo: () => set(createSeedData()),

      setUserName: (name) => set({ userName: name }),

      getMetrics: () => calculateMetrics(getFinancialState(get())),
      getForecast: () => calculateForecast(getFinancialState(get())),
      getInsights: () => {
        const state = getFinancialState(get());
        const metrics = calculateMetrics(state);
        return generateInsights(state, metrics);
      },
    }),
    {
      name: 'paisapilot-storage',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);
