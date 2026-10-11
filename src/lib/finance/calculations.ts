import type {
  FinancialState,
  FinancialMetrics,
  Transaction,
  Commitment,
  Subscription,
  SavingsGoal,
  DayForecast,
  RiskLevel,
  DecisionType,
  TransactionCategory,
  SimulationPreview,
} from '@/types/finance';

// ─── Constants ────────────────────────────────────────────────────────────────
export const INITIAL_BUDGET_PAISE = 1_000_000; // ₹10,000 in paise
export const TOTAL_DAYS = 30;

// ─── Formatting ───────────────────────────────────────────────────────────────
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

// ─── Reserved Commitments ─────────────────────────────────────────────────────
/**
 * Calculate total money reserved for upcoming (unpaid) commitments
 * from current day onwards. Does NOT include already-paid commitments.
 */
export function calculateReservedCommitments(
  commitments: Commitment[],
  subscriptions: Subscription[],
  currentDay: number,
  totalDays: number
): number {
  let reserved = 0;

  // Upcoming commitments (not yet paid)
  for (const c of commitments) {
    if (c.status === 'upcoming' && c.dueDay >= currentDay) {
      reserved += c.amount;
    }
  }

  // Active subscriptions billing in remaining days
  for (const s of subscriptions) {
    if (s.isActive && !s.isPaused && s.billingDay >= currentDay && s.billingDay <= totalDays) {
      reserved += s.amount;
    }
  }

  return reserved;
}

// ─── Spendable Balance ────────────────────────────────────────────────────────
/**
 * Spendable balance = currentCash - reservedCommitments
 * Never goes below 0 for allowance calculations.
 */
export function calculateSpendableBalance(
  currentCash: number,
  reservedCommitments: number,
  _savingsGoals: SavingsGoal[] = []
): number {
  return Math.max(0, currentCash - reservedCommitments);
}

// ─── Safe Daily Allowance ─────────────────────────────────────────────────────
export function calculateSafeDailyAllowance(
  spendableBalance: number,
  daysRemaining: number
): number {
  if (daysRemaining <= 0 || spendableBalance <= 0) return 0;
  return Math.floor(spendableBalance / daysRemaining);
}

// ─── Projected Closing Balance ────────────────────────────────────────────────
/**
 * Project the balance at end of simulation period.
 * currentCash - upcoming commitments - upcoming subscriptions - projected discretionary
 */
export function calculateProjectedClosingBalance(
  currentCash: number,
  commitments: Commitment[],
  subscriptions: Subscription[],
  currentDay: number,
  totalDays: number,
  averageDailySpend: number
): number {
  const reserved = calculateReservedCommitments(commitments, subscriptions, currentDay, totalDays);
  const daysRemaining = totalDays - currentDay;
  const projectedDiscretionary = averageDailySpend * daysRemaining;
  return currentCash - reserved - projectedDiscretionary;
}

// ─── Risk Assessment ──────────────────────────────────────────────────────────
export function calculateRiskLevel(
  projectedClosingBalance: number,
  reservedCommitments: number,
  currentCash: number,
  daysRemaining: number
): { level: RiskLevel; factors: string[] } {
  const factors: string[] = [];
  let score = 0; // higher = riskier

  if (projectedClosingBalance < 0) {
    score += 40;
    factors.push(`Projected balance is negative (${formatINR(projectedClosingBalance)})`);
  } else if (projectedClosingBalance < 50000) { // < ₹500
    score += 20;
    factors.push('Projected closing balance is very low');
  }

  if (currentCash < reservedCommitments) {
    score += 30;
    factors.push('Current cash cannot cover upcoming commitments');
  } else if (currentCash < reservedCommitments * 1.2) {
    score += 15;
    factors.push('Current cash barely covers upcoming commitments');
  }

  if (daysRemaining > 0 && currentCash / daysRemaining < 20000) { // < ₹200/day
    score += 20;
    factors.push('Daily spending capacity is critically low');
  }

  if (projectedClosingBalance < reservedCommitments * 0.5) {
    score += 10;
    factors.push('High ratio of commitments to projected balance');
  }

  let level: RiskLevel;
  if (score >= 60) level = 'critical';
  else if (score >= 35) level = 'high';
  else if (score >= 15) level = 'medium';
  else level = 'low';

  if (factors.length === 0) factors.push('Financial position looks healthy');

  return { level, factors };
}

// ─── Health Score ─────────────────────────────────────────────────────────────
export function calculateHealthScore(
  projectedClosingBalance: number,
  reservedCommitments: number,
  currentCash: number,
  savingsGoals: SavingsGoal[],
  daysRemaining: number,
  totalDays: number
): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 100;

  // Can we cover commitments?
  if (currentCash < reservedCommitments) {
    score -= 30;
    factors.push('Cannot cover upcoming commitments');
  } else {
    factors.push('All commitments covered');
  }

  // Projected closing balance
  if (projectedClosingBalance < 0) {
    score -= 25;
    factors.push('Projected to end the month with a deficit');
  } else if (projectedClosingBalance > 100000) {
    factors.push('Projected positive month-end balance');
  }

  // Savings goal progress
  if (savingsGoals.length > 0) {
    const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const progress = totalTarget > 0 ? totalCurrent / totalTarget : 0;
    const expectedProgress = (totalDays - daysRemaining) / totalDays;

    if (progress >= expectedProgress) {
      factors.push('On track with savings goals');
    } else {
      score -= 15;
      factors.push('Behind on savings goals');
    }
  }

  // Buffer check
  const spendableRatio = (currentCash - reservedCommitments) / Math.max(1, currentCash);
  if (spendableRatio < 0.1) {
    score -= 20;
    factors.push('Very low spending buffer');
  } else if (spendableRatio > 0.4) {
    factors.push('Good spending buffer available');
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

// ─── Total Savings ────────────────────────────────────────────────────────────
export function calculateTotalSavings(savingsGoals: SavingsGoal[]): number {
  return savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
}

// ─── Average Daily Spend ──────────────────────────────────────────────────────
export function calculateAverageDailySpend(
  transactions: Transaction[],
  currentDay: number
): number {
  if (currentDay <= 1) return 0;
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return Math.round(expenses / Math.max(1, currentDay - 1));
}

// ─── Full Metrics Calculation ─────────────────────────────────────────────────
export function calculateMetrics(state: FinancialState): FinancialMetrics {
  const daysRemaining = state.totalDays - state.currentDay;
  const percentDaysPassed = ((state.currentDay - 1) / state.totalDays) * 100;

  const reservedCommitments = calculateReservedCommitments(
    state.commitments,
    state.subscriptions,
    state.currentDay,
    state.totalDays
  );

  const spendableBalance = calculateSpendableBalance(
    state.currentCash,
    reservedCommitments,
    state.savingsGoals
  );

  const safeDailyAllowance = calculateSafeDailyAllowance(spendableBalance, daysRemaining);

  const avgDailySpend = calculateAverageDailySpend(state.transactions, state.currentDay);

  const projectedClosingBalance = calculateProjectedClosingBalance(
    state.currentCash,
    state.commitments,
    state.subscriptions,
    state.currentDay,
    state.totalDays,
    avgDailySpend
  );

  const { level: riskLevel, factors: riskFactors } = calculateRiskLevel(
    projectedClosingBalance,
    reservedCommitments,
    state.currentCash,
    daysRemaining
  );

  const totalSavings = calculateTotalSavings(state.savingsGoals);
  const totalSavingsTarget = state.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const savingsProgress = totalSavingsTarget > 0
    ? Math.min(100, (totalSavings / totalSavingsTarget) * 100)
    : 0;

  const { score: healthScore, factors: healthFactors } = calculateHealthScore(
    projectedClosingBalance,
    reservedCommitments,
    state.currentCash,
    state.savingsGoals,
    daysRemaining,
    state.totalDays
  );

  const commitmentCoverage = reservedCommitments > 0
    ? Math.round((state.currentCash / reservedCommitments) * 100)
    : 100;

  return {
    currentCash: state.currentCash,
    reservedCommitments,
    spendableBalance,
    safeDailyAllowance,
    projectedClosingBalance,
    commitmentCoverage,
    totalSavings,
    savingsProgress,
    riskLevel,
    healthScore,
    healthFactors,
    riskFactors,
    daysRemaining,
    percentDaysPassed,
  };
}

// ─── 30-Day Forecast ──────────────────────────────────────────────────────────
export function calculateForecast(state: FinancialState): DayForecast[] {
  const forecast: DayForecast[] = [];
  const avgDailySpend = calculateAverageDailySpend(state.transactions, state.currentDay);

  // Build a running balance from initial budget applying transactions by day
  let runningBalance = state.initialBudget;
  const transactionsByDay = new Map<number, Transaction[]>();
  for (const t of state.transactions) {
    if (!transactionsByDay.has(t.day)) transactionsByDay.set(t.day, []);
    transactionsByDay.get(t.day)!.push(t);
  }

  // Commitment map by day
  const commitmentsByDay = new Map<number, Commitment[]>();
  for (const c of state.commitments) {
    if (!commitmentsByDay.has(c.dueDay)) commitmentsByDay.set(c.dueDay, []);
    commitmentsByDay.get(c.dueDay)!.push(c);
  }

  // Subscription map by day
  const subscriptionsByDay = new Map<number, Subscription[]>();
  for (const s of state.subscriptions) {
    if (s.isActive && !s.isPaused) {
      if (!subscriptionsByDay.has(s.billingDay)) subscriptionsByDay.set(s.billingDay, []);
      subscriptionsByDay.get(s.billingDay)!.push(s);
    }
  }

  for (let day = 1; day <= state.totalDays; day++) {
    const isProjected = day > state.currentDay;
    const events: string[] = [];

    if (!isProjected) {
      // Use actual transaction data
      const dayTx = transactionsByDay.get(day) || [];
      for (const tx of dayTx) {
        if (tx.type === 'income') {
          runningBalance += tx.amount;
          events.push(`+${formatINR(tx.amount)} ${tx.description}`);
        } else if (tx.type === 'expense') {
          runningBalance -= tx.amount;
          events.push(`-${formatINR(tx.amount)} ${tx.description}`);
        }
      }
    } else {
      // Project based on commitments + average spend
      const dayCom = commitmentsByDay.get(day) || [];
      const daySub = subscriptionsByDay.get(day) || [];
      for (const c of dayCom) {
        if (c.status === 'upcoming') {
          runningBalance -= c.amount;
          events.push(`-${formatINR(c.amount)} ${c.name} (bill)`);
        }
      }
      for (const s of daySub) {
        runningBalance -= s.amount;
        events.push(`-${formatINR(s.amount)} ${s.name} (subscription)`);
      }
      // Apply average daily discretionary spend
      runningBalance -= avgDailySpend;
    }

    forecast.push({
      day,
      balance: runningBalance,
      isProjected,
      events,
    });
  }

  return forecast;
}

// ─── Generate Insights ────────────────────────────────────────────────────────
export function generateInsights(state: FinancialState, metrics: FinancialMetrics): string[] {
  const insights: string[] = [];
  const { safeDailyAllowance, projectedClosingBalance, riskLevel, savingsProgress } = metrics;

  if (riskLevel === 'critical' || riskLevel === 'high') {
    insights.push(`Your spending pace is unsustainable. Consider cutting discretionary expenses immediately.`);
  }

  if (safeDailyAllowance < 20000) {
    insights.push(`Your safe daily allowance is only ${formatINR(safeDailyAllowance)}. Prioritize essentials.`);
  } else if (safeDailyAllowance > 50000) {
    insights.push(`You have ${formatINR(safeDailyAllowance)} safe to spend per day — you're doing well!`);
  }

  if (projectedClosingBalance < 0) {
    insights.push(`You're projected to run out of money before day 30. Reduce spending by at least ${formatINR(Math.abs(projectedClosingBalance))}.`);
  }

  if (savingsProgress > 80) {
    insights.push(`You're ${Math.round(savingsProgress)}% toward your savings goal. Great progress!`);
  } else if (savingsProgress < 30 && metrics.percentDaysPassed > 50) {
    insights.push(`You're only ${Math.round(savingsProgress)}% toward your savings goal with more than half the month gone.`);
  }

  const subscriptionTotal = state.subscriptions
    .filter(s => s.isActive && !s.isPaused)
    .reduce((sum, s) => sum + s.amount, 0);
  if (subscriptionTotal > 100000) {
    insights.push(`Your active subscriptions cost ${formatINR(subscriptionTotal)}/month. Review if all are essential.`);
  }

  if (insights.length === 0) {
    insights.push('Your finances look healthy. Keep up the good work!');
  }

  return insights;
}

// ─── Decision Simulation Engine ──────────────────────────────────────────────
export function simulateDecision(
  state: FinancialState,
  decision: {
    type: DecisionType;
    amount: number; // in paise
    description: string;
    category: TransactionCategory;
    isRecurring?: boolean;
    day?: number;
    id?: string;
    appliedAt?: string;
    isApplied?: boolean;
  }
): SimulationPreview {
  const currentMetrics = calculateMetrics(state);
  const decisionDay = decision.day || state.currentDay;

  // Clone state immutably
  let simCash = state.currentCash;
  let simSpent = state.totalSpent;
  let simIncome = state.totalIncome;
  const simCommitments = [...state.commitments];
  const simSubscriptions = [...state.subscriptions];
  const simSavingsGoals = state.savingsGoals.map(g => ({ ...g }));

  if (decision.type === 'income') {
    simCash += decision.amount;
    simIncome += decision.amount;
  } else if (decision.type === 'savings') {
    // Transfer from cash to savings
    simCash -= decision.amount;
    if (simSavingsGoals.length > 0) {
      simSavingsGoals[0].currentAmount += decision.amount;
    }
  } else if (decision.type === 'subscription') {
    // Add recurring subscription
    simSubscriptions.push({
      id: 'sim_sub',
      name: decision.description,
      amount: decision.amount,
      category: decision.category,
      billingDay: decisionDay,
      isActive: true,
      isPaused: false,
    });
    // If billing today or earlier, immediate deduction
    if (decisionDay <= state.currentDay) {
      simCash -= decision.amount;
      simSpent += decision.amount;
    }
  } else if (decision.type === 'bill') {
    // Add upcoming bill
    simCommitments.push({
      id: 'sim_bill',
      name: decision.description,
      amount: decision.amount,
      category: decision.category,
      dueDay: Math.max(state.currentDay, decisionDay),
      status: 'upcoming',
      isRecurring: !!decision.isRecurring,
    });
  } else {
    // One-time purchase or emergency
    simCash -= decision.amount;
    simSpent += decision.amount;
  }

  const hypotheticalState: FinancialState = {
    ...state,
    currentCash: simCash,
    totalSpent: simSpent,
    totalIncome: simIncome,
    commitments: simCommitments,
    subscriptions: simSubscriptions,
    savingsGoals: simSavingsGoals,
  };

  const simulatedMetrics = calculateMetrics(hypotheticalState);

  const deltas = {
    balance: simulatedMetrics.currentCash - currentMetrics.currentCash,
    dailyAllowance: simulatedMetrics.safeDailyAllowance - currentMetrics.safeDailyAllowance,
    savingsProgress: simulatedMetrics.savingsProgress - currentMetrics.savingsProgress,
    closingBalance: simulatedMetrics.projectedClosingBalance - currentMetrics.projectedClosingBalance,
    healthScore: simulatedMetrics.healthScore - currentMetrics.healthScore,
    commitmentCoverage: simulatedMetrics.commitmentCoverage - currentMetrics.commitmentCoverage,
  };

  // Generate decision-specific warnings
  const warnings: string[] = [];
  if (simulatedMetrics.currentCash < simulatedMetrics.reservedCommitments) {
    const deficit = simulatedMetrics.reservedCommitments - simulatedMetrics.currentCash;
    warnings.push(`Critical: This decision leaves you with a ${formatINR(deficit)} shortfall for upcoming bills!`);
  }
  if (simulatedMetrics.projectedClosingBalance < 0) {
    warnings.push(`Projected month-end deficit of ${formatINR(Math.abs(simulatedMetrics.projectedClosingBalance))}.`);
  }
  if (simulatedMetrics.safeDailyAllowance < 15000 && currentMetrics.safeDailyAllowance >= 15000) {
    warnings.push(`Daily allowance crushed below ₹150/day. High risk of running out of money before Day 30.`);
  }

  // Generate decision-specific insights
  const simInsights: string[] = [];
  if (decision.type === 'income') {
    simInsights.push(`Boosts your safe daily allowance by ${formatINR(Math.abs(deltas.dailyAllowance))}/day.`);
  } else if (decision.type === 'savings') {
    simInsights.push(`Accelerates savings goal progress by +${Math.round(deltas.savingsProgress)}%.`);
  } else if (decision.type === 'subscription') {
    simInsights.push(`Adds a recurring obligation of ${formatINR(decision.amount)} every month.`);
  } else {
    simInsights.push(`Reduces daily spendable allowance by ${formatINR(Math.abs(deltas.dailyAllowance))}/day.`);
  }

  return {
    decision,
    current: currentMetrics,
    simulated: simulatedMetrics,
    deltas,
    warnings,
    insights: simInsights,
  };
}
