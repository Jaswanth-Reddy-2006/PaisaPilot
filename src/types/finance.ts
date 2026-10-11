export type TransactionType = 'income' | 'expense' | 'transfer' | 'savings';
export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'rent'
  | 'health'
  | 'education'
  | 'savings'
  | 'income'
  | 'subscription'
  | 'emergency'
  | 'other';

export type CommitmentStatus = 'upcoming' | 'paid' | 'overdue';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type DecisionType = 'purchase' | 'subscription' | 'emergency' | 'income' | 'savings' | 'bill';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number; // in paise (1 INR = 100 paise)
  description: string;
  date: string; // ISO date string
  day: number; // simulation day 1-30
  isSimulated?: boolean;
}

export interface Commitment {
  id: string;
  name: string;
  category: TransactionCategory;
  amount: number; // in paise
  dueDay: number; // simulation day
  status: CommitmentStatus;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'weekly';
}

export interface Subscription {
  id: string;
  name: string;
  amount: number; // in paise per month
  category: TransactionCategory;
  billingDay: number; // simulation day it bills
  isActive: boolean;
  isPaused: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number; // in paise
  currentAmount: number; // in paise
  deadline: string; // ISO date string
  targetDay: number; // simulation day deadline
  description?: string;
  color: string;
}

export interface Decision {
  id: string;
  type: DecisionType;
  description: string;
  amount: number; // in paise
  category: TransactionCategory;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'weekly';
  day: number; // simulation day applied
  appliedAt: string; // ISO timestamp
  isApplied: boolean;
}

export interface FinancialState {
  // Core
  initialBudget: number; // paise
  currentDay: number; // 1-30
  totalDays: number; // 30

  // Money
  currentCash: number; // paise - actual available cash
  totalIncome: number; // paise - initial budget + additional income
  totalSpent: number; // paise - money actually spent

  // Collections
  transactions: Transaction[];
  commitments: Commitment[];
  subscriptions: Subscription[];
  savingsGoals: SavingsGoal[];
  decisions: Decision[];

  // Settings
  userName: string;
  isDemoMode: boolean;
}

export interface FinancialMetrics {
  currentCash: number;
  reservedCommitments: number;
  spendableBalance: number;
  safeDailyAllowance: number;
  projectedClosingBalance: number;
  commitmentCoverage: number; // 0-100% or higher
  totalSavings: number;
  savingsProgress: number; // 0-100
  riskLevel: RiskLevel;
  healthScore: number; // 0-100
  healthFactors: string[];
  riskFactors: string[];
  daysRemaining: number;
  percentDaysPassed: number;
}

export interface SimulationPreview {
  decision: Partial<Decision>;
  current: FinancialMetrics;
  simulated: FinancialMetrics;
  deltas: {
    balance: number;
    dailyAllowance: number;
    savingsProgress: number;
    closingBalance: number;
    healthScore: number;
    commitmentCoverage: number;
  };
  warnings: string[];
  insights: string[];
}

export interface DayForecast {
  day: number;
  balance: number;
  isProjected: boolean;
  events: string[];
}
