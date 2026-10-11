import type { FinancialState, Transaction, Commitment, Subscription, SavingsGoal } from '@/types/finance';
import { INITIAL_BUDGET_PAISE, rupeesToPaise } from './calculations';

export function createSeedData(): FinancialState {
  const currentDay = 8; // We're on day 8 of the month

  const transactions: Transaction[] = [
    {
      id: 'tx-seed-1',
      type: 'income',
      category: 'income',
      amount: INITIAL_BUDGET_PAISE,
      description: 'Monthly budget',
      date: '2024-01-01',
      day: 1,
    },
    {
      id: 'tx-seed-2',
      type: 'expense',
      category: 'food',
      amount: rupeesToPaise(120),
      description: 'Breakfast - Chai & Paratha',
      date: '2024-01-01',
      day: 1,
    },
    {
      id: 'tx-seed-3',
      type: 'expense',
      category: 'transport',
      amount: rupeesToPaise(45),
      description: 'Auto rickshaw',
      date: '2024-01-02',
      day: 2,
    },
    {
      id: 'tx-seed-4',
      type: 'expense',
      category: 'food',
      amount: rupeesToPaise(280),
      description: 'Lunch with friends',
      date: '2024-01-03',
      day: 3,
    },
    {
      id: 'tx-seed-5',
      type: 'expense',
      category: 'entertainment',
      amount: rupeesToPaise(399),
      description: 'Movie tickets (BookMyShow)',
      date: '2024-01-04',
      day: 4,
    },
    {
      id: 'tx-seed-6',
      type: 'expense',
      category: 'food',
      amount: rupeesToPaise(180),
      description: 'Grocery run (Blinkit)',
      date: '2024-01-05',
      day: 5,
    },
    {
      id: 'tx-seed-7',
      type: 'expense',
      category: 'shopping',
      amount: rupeesToPaise(599),
      description: 'T-shirt (H&M sale)',
      date: '2024-01-06',
      day: 6,
    },
    {
      id: 'tx-seed-8',
      type: 'expense',
      category: 'food',
      amount: rupeesToPaise(350),
      description: 'Dinner - Zomato order',
      date: '2024-01-07',
      day: 7,
    },
    {
      id: 'tx-seed-9',
      type: 'expense',
      category: 'transport',
      amount: rupeesToPaise(89),
      description: 'Rapido ride',
      date: '2024-01-08',
      day: 8,
    },
  ];

  // Calculate currentCash from transactions
  const currentCash = transactions.reduce((cash, t) => {
    if (t.type === 'income') return cash + t.amount;
    if (t.type === 'expense') return cash - t.amount;
    return cash;
  }, 0);

  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const commitments: Commitment[] = [
    {
      id: 'com-seed-1',
      name: 'Room Rent',
      category: 'rent',
      amount: rupeesToPaise(3500),
      dueDay: 28,
      status: 'upcoming',
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
    {
      id: 'com-seed-2',
      name: 'Electricity Bill',
      category: 'utilities',
      amount: rupeesToPaise(350),
      dueDay: 15,
      status: 'upcoming',
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
    {
      id: 'com-seed-3',
      name: 'Internet Bill',
      category: 'utilities',
      amount: rupeesToPaise(299),
      dueDay: 20,
      status: 'upcoming',
      isRecurring: true,
      recurringFrequency: 'monthly',
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub-seed-1',
      name: 'Spotify',
      amount: rupeesToPaise(119),
      category: 'subscription',
      billingDay: 12,
      isActive: true,
      isPaused: false,
    },
    {
      id: 'sub-seed-2',
      name: 'Netflix',
      amount: rupeesToPaise(199),
      category: 'subscription',
      billingDay: 18,
      isActive: true,
      isPaused: false,
    },
    {
      id: 'sub-seed-3',
      name: 'Swiggy One',
      amount: rupeesToPaise(149),
      category: 'subscription',
      billingDay: 25,
      isActive: true,
      isPaused: false,
    },
  ];

  const savingsGoals: SavingsGoal[] = [
    {
      id: 'goal-seed-1',
      name: 'Emergency Fund',
      targetAmount: rupeesToPaise(2000),
      currentAmount: rupeesToPaise(500),
      deadline: '2024-01-30',
      targetDay: 30,
      description: 'Safety net for unexpected expenses',
      color: '#073B2F',
    },
    {
      id: 'goal-seed-2',
      name: 'New Headphones',
      targetAmount: rupeesToPaise(1500),
      currentAmount: rupeesToPaise(300),
      deadline: '2024-01-30',
      targetDay: 30,
      description: 'Sony WH-1000XM5',
      color: '#27834A',
    },
  ];

  return {
    initialBudget: INITIAL_BUDGET_PAISE,
    currentDay,
    totalDays: 30,
    currentCash,
    totalIncome: INITIAL_BUDGET_PAISE,
    totalSpent,
    transactions,
    commitments,
    subscriptions,
    savingsGoals,
    decisions: [],
    userName: 'Arjun',
    isDemoMode: true,
  };
}
