'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useFinanceStore } from '@/store/finance-store';
import {
  formatINR,
  rupeesToPaise,
  calculateMetrics,
  calculateForecast,
  simulateDecision,
  generateInsights,
} from '@/lib/finance/calculations';
import { sanitizeText } from '@/lib/validation/sanitize';
import type { DecisionType, TransactionCategory } from '@/types/finance';
import {
  MetricCard,
  VirtualCard,
  RiskBadge,
  ProgressRing,
} from '@/components/ui/Cards';
import { CategoryIcon, CategoryBadge } from '@/components/ui/CategoryBadge';
import {
  Zap,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  DollarSign,
  Wallet,
  PiggyBank,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useHydrated } from '@/hooks/useHydrated';
import { createSeedData } from '@/lib/finance/seed-data';

export default function DashboardPage() {
  const store = useFinanceStore();
  const isHydrated = useHydrated();
  const seed = useMemo(() => createSeedData(), []);

  const activeCash = isHydrated ? store.currentCash : seed.currentCash;
  const activeDay = isHydrated ? store.currentDay : seed.currentDay;
  const activeTotalDays = isHydrated ? store.totalDays : seed.totalDays;
  const activeSpent = isHydrated ? store.totalSpent : seed.totalSpent;
  const activeUserName = isHydrated ? store.userName : seed.userName;
  const activeTransactions = isHydrated ? store.transactions : seed.transactions;
  const activeCommitments = isHydrated ? store.commitments : seed.commitments;
  const activeGoals = isHydrated ? store.savingsGoals : seed.savingsGoals;

  const metrics = isHydrated ? store.getMetrics() : calculateMetrics(seed);
  const forecast = isHydrated ? store.getForecast() : calculateForecast(seed);
  const insights = isHydrated ? store.getInsights() : generateInsights(seed, metrics);

  // Quick Transaction Modal State
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txCategory, setTxCategory] = useState<TransactionCategory>('food');

  // Decision Simulator Sandbox Card State
  const [simType, setSimType] = useState<DecisionType>('purchase');
  const [simCategory, setSimCategory] = useState<TransactionCategory>('shopping');
  const [simAmountRupees, setSimAmountRupees] = useState<string>('2000');
  const [simDescription, setSimDescription] = useState<string>('Wireless Headphones');
  const [simFeedback, setSimFeedback] = useState<{ applied?: boolean; discarded?: boolean } | null>(null);

  // Computed Simulation Delta Preview using canonical financial engine
  const simPreview = useMemo(() => {
    const amountNum = parseFloat(simAmountRupees) || 0;
    const amountPaise = rupeesToPaise(amountNum);
    if (amountPaise <= 0) return null;

    const currentState = {
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

    const res = simulateDecision(currentState, {
      type: simType,
      amount: amountPaise,
      description: simDescription || 'Hypothetical Decision',
      category: simCategory,
    });

    return {
      amountPaise,
      currentCash: res.current.currentCash,
      simulatedCash: res.simulated.currentCash,
      cashDelta: res.deltas.balance,
      currentDaily: res.current.safeDailyAllowance,
      simulatedDaily: res.simulated.safeDailyAllowance,
      dailyDelta: res.deltas.dailyAllowance,
      currentClosing: res.current.projectedClosingBalance,
      simulatedClosing: res.simulated.projectedClosingBalance,
      closingDelta: res.deltas.closingBalance,
      currentRisk: res.current.riskLevel,
      simulatedRisk: res.simulated.riskLevel,
      currentHealth: res.current.healthScore,
      simulatedHealth: res.simulated.healthScore,
      healthDelta: res.deltas.healthScore,
      warnings: res.warnings,
      insights: res.insights,
    };
  }, [simAmountRupees, simType, simCategory, simDescription, store]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddTxModal(false);
      }
    };
    if (showAddTxModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showAddTxModal]);

  // Apply simulated decision to live state
  const handleApplySimDecision = () => {
    if (!simPreview) return;
    store.applyDecision({
      type: simType,
      category: simCategory,
      amount: simPreview.amountPaise,
      description: sanitizeText(simDescription) || 'Simulated decision',
      isRecurring: false,
      day: store.currentDay,
    });
    setSimFeedback({ applied: true });
    setTimeout(() => setSimFeedback(null), 3500);
  };

  const handleDiscardSimDecision = () => {
    setSimAmountRupees('');
    setSimDescription('');
    setSimFeedback({ discarded: true });
    setTimeout(() => setSimFeedback(null), 2500);
  };

  // Add Transaction Handler
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (!amountNum || amountNum <= 0) return;

    store.addTransaction({
      type: txType,
      category: txCategory,
      amount: rupeesToPaise(amountNum),
      description: sanitizeText(txDesc) || (txType === 'income' ? 'Income deposit' : 'Expense payment'),
      date: new Date().toISOString().split('T')[0],
      day: store.currentDay,
    });

    setTxDesc('');
    setTxAmount('');
    setShowAddTxModal(false);
  };

  // 30-Day Forecast Chart Data
  const forecastChartData = useMemo(() => {
    return forecast.map((f) => ({
      day: `D${f.day}`,
      rawDay: f.day,
      balance: Math.round(f.balance / 100),
      isProjected: f.isProjected,
    }));
  }, [forecast]);

  // Spending Category Breakdown Data for Donut Chart
  const categoryChartData = useMemo(() => {
    const expenses = store.transactions.filter((t) => t.type === 'expense');
    const totals: Record<string, number> = {};
    for (const t of expenses) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }

    const colors: Record<string, string> = {
      food: '#B7F477',
      transport: '#14251F',
      entertainment: '#073B2F',
      shopping: '#A0A6A0',
      utilities: '#C28A24',
      rent: '#D94B4B',
      health: '#27834A',
      other: '#E5E8E3',
    };

    return Object.entries(totals)
      .map(([cat, amountPaise]) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        amount: Math.round(amountPaise / 100),
        amountPaise,
        color: colors[cat] || '#7B827E',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [store.transactions]);

  // Recent transactions list
  const recentTransactions = useMemo(() => {
    return [...store.transactions]
      .sort((a, b) => b.day - a.day)
      .slice(0, 6);
  }, [store.transactions]);

  // Upcoming commitments
  const upcomingCommitments = useMemo(() => {
    return store.commitments
      .filter((c) => c.status === 'upcoming' && c.dueDay >= store.currentDay)
      .sort((a, b) => a.dueDay - b.dueDay)
      .slice(0, 4);
  }, [store.commitments, store.currentDay]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Reference Asymmetric Multi-Column Dashboard Layout ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
        
        {/* ═════════════════════════════════════════════════════════════════════
            COLUMN 1: Welcome & Balance Card + 30-Day Forecast (3.8 of 12 cols)
            ═════════════════════════════════════════════════════════════════════ */}
        <div className="md:col-span-1 lg:col-span-4 space-y-6">
          
          {/* Card A: Welcome & Balance Card (Reference screenshot exact styling) */}
          <div className="bg-white rounded-[26px] p-6 border border-[#E5E8E3] shadow-[0_2px_12px_rgba(20,37,31,0.04)] relative overflow-hidden">
            {/* Header / Avatar Row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#073B2F] to-[#27834A] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {store.userName.charAt(0)}
              </div>
              <div>
                <div className="text-xs text-[#7B827E] font-medium">Good morning!</div>
                <div className="text-sm font-bold text-[#14251F]">Hi, {store.userName}</div>
              </div>
            </div>

            {/* Big Financial Balance */}
            <div className="my-3">
              <div className="text-[11px] text-[#7B827E] font-semibold tracking-wide uppercase">
                Available Liquid Cash
              </div>
              <div className="text-3xl sm:text-4xl lg:text-[42px] font-black font-mono tracking-tight text-[#14251F] mt-0.5 leading-none">
                {formatINR(metrics.currentCash)}
              </div>
              <div className="text-xs text-[#7B827E] mt-2 font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#27834A]" />
                <span>{formatINR(store.totalSpent)} spent from your ₹10,000 budget</span>
              </div>
            </div>

            {/* Two Main Reference Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <Link
                href="/simulate"
                className="py-3 px-4 rounded-xl bg-[#073B2F] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#0B4A3A] transition-all shadow-sm group"
              >
                <span>Simulate</span>
                <Zap className="w-3.5 h-3.5 text-[#B7F477] transition-transform group-hover:scale-110" />
              </Link>
              <button
                onClick={() => setShowAddTxModal(true)}
                className="py-3 px-4 rounded-xl bg-[#A4E763] text-[#073B2F] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#B7F477] transition-all shadow-sm"
              >
                <span>Add</span>
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Sub-Widgets: Fiat Wallets & Daily Limit Sparkline Blocks (Fynix style) */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#F0F2EE]">
              <div className="bg-[#F4F5F3] p-3 rounded-2xl border border-[#E5E8E3]">
                <div className="flex items-center justify-between text-[10px] text-[#7B827E] font-semibold uppercase">
                  <span>Spendable</span>
                  <Wallet className="w-3 h-3 text-[#073B2F]" />
                </div>
                <div className="text-sm font-bold font-mono text-[#14251F] mt-1">
                  {formatINR(metrics.spendableBalance)}
                </div>
                <div className="text-[10px] text-[#27834A] font-medium mt-0.5 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>Unencumbered</span>
                </div>
              </div>

              <div className="bg-[#F4F5F3] p-3 rounded-2xl border border-[#E5E8E3]">
                <div className="flex items-center justify-between text-[10px] text-[#7B827E] font-semibold uppercase">
                  <span>Daily Cap</span>
                  <Zap className="w-3 h-3 text-[#A4E763]" />
                </div>
                <div className="text-sm font-bold font-mono text-[#073B2F] mt-1">
                  {formatINR(metrics.safeDailyAllowance)}/d
                </div>
                <div className="text-[10px] text-[#7B827E] font-medium mt-0.5">
                  <span>{metrics.daysRemaining} days left</span>
                </div>
              </div>
            </div>

            {/* Mini Verda Debit Card Graphic (Reference style) */}
            <div className="mt-4">
              <VirtualCard
                balanceFormatted={formatINR(metrics.currentCash)}
                userName={store.userName}
                currentDay={store.currentDay}
                totalDays={store.totalDays}
                safeDailyFormatted={`${formatINR(metrics.safeDailyAllowance)}/d`}
                cardVariant="forest"
              />
            </div>
          </div>

          {/* Card E: 30-Day Cashflow Forecast Card (Recharts) */}
          <div className="bg-white rounded-[26px] p-6 border border-[#E5E8E3] shadow-[0_2px_12px_rgba(20,37,31,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#7B827E] font-semibold tracking-wide uppercase">
                  Cashflow Projection
                </span>
                <div className="text-lg font-bold text-[#14251F] mt-0.5">
                  30-Day Trajectory
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-[#7B827E] uppercase block">End Balance</span>
                <span className={cn('text-sm font-extrabold', metrics.projectedClosingBalance >= 0 ? 'text-[#27834A]' : 'text-[#D94B4B]')}>
                  {formatINR(metrics.projectedClosingBalance)}
                </span>
              </div>
            </div>

            {/* Area Chart with forest green trend line & pale mint fill */}
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A4E763" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A4E763" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E8E3" />
                  <XAxis
                    dataKey="day"
                    stroke="#A0A6A0"
                    fontSize={10}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    stroke="#A0A6A0"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#14251F] text-white p-2.5 rounded-xl text-xs shadow-lg font-mono">
                          <div className="font-bold text-[#A4E763]">Day {d.rawDay}</div>
                          <div>Balance: ₹{d.balance.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-slate-300">
                            {d.isProjected ? 'Projected forecast' : 'Actual historical'}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#073B2F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#7B827E] pt-2 border-t border-[#F0F2EE]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#073B2F]" />
                <span>Actual (Days 1–{store.currentDay})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A4E763]" />
                <span>Projected (Days {store.currentDay + 1}–30)</span>
              </span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            COLUMN 2: 4 Summary Cards + Financial Health & Donut (3.8 of 12 cols)
            ═════════════════════════════════════════════════════════════════════ */}
        <div className="md:col-span-1 lg:col-span-4 space-y-6">
          
          {/* Card B: Four Financial Summary Cards in a 2x2 Grid (Reference screenshot) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* 1. Safe Daily Limit Card (Lime Accent Card!) */}
            <MetricCard
              title="Safe Daily Spend"
              value={`${formatINR(metrics.safeDailyAllowance)}`}
              subtitle={`Over ${metrics.daysRemaining} days left`}
              trend="up"
              trendValue="Safe"
              trendLabel="burn limit"
              variant="lime"
              icon={<Zap className="w-4 h-4 text-[#073B2F]" />}
            />

            {/* 2. Total Spending Card */}
            <MetricCard
              title="Total Spent"
              value={formatINR(store.totalSpent)}
              subtitle={`From ₹10,000 budget`}
              trend="down"
              trendValue={`${Math.round((store.totalSpent / store.initialBudget) * 100)}%`}
              trendLabel="consumed"
              variant="default"
              icon={<CreditCard className="w-4 h-4 text-[#7B827E]" />}
            />

            {/* 3. Upcoming Commitments Card */}
            <MetricCard
              title="Reserved Bills"
              value={formatINR(metrics.reservedCommitments)}
              subtitle="Rent, power & OTT"
              trend="neutral"
              trendValue="Day 15-28"
              trendLabel="due"
              variant="default"
              icon={<CalendarDays className="w-4 h-4 text-[#7B827E]" />}
            />

            {/* 4. Savings Progress Card */}
            <MetricCard
              title="Savings Vault"
              value={formatINR(metrics.totalSavings)}
              subtitle={`${Math.round(metrics.savingsProgress)}% of targets`}
              trend="up"
              trendValue={`${Math.round(metrics.savingsProgress)}%`}
              trendLabel="funded"
              variant="default"
              icon={<PiggyBank className="w-4 h-4 text-[#7B827E]" />}
            />
          </div>

          {/* Card C & D: Net Worth / Financial Health & Category Donut Breakdown */}
          <div className="bg-white rounded-[26px] p-6 border border-[#E5E8E3] shadow-[0_2px_12px_rgba(20,37,31,0.04)] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#7B827E] font-semibold tracking-wide uppercase">
                  Diagnostics & Categories
                </span>
                <div className="text-lg font-bold text-[#14251F] mt-0.5">
                  Spending Distribution
                </div>
              </div>
              <RiskBadge level={metrics.riskLevel} />
            </div>

            {/* Donut Chart with Centered Metric (Fynix style) */}
            <div className="relative h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={84}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#14251F] text-white p-2 rounded-xl text-xs shadow-md font-mono">
                          <span className="font-bold">{d.name}</span>: ₹{d.amount.toLocaleString('en-IN')}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Centered Total / Health Score in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-[#7B827E] uppercase font-semibold">Health Score</span>
                <span className="text-2xl font-black font-mono text-[#073B2F] leading-tight">
                  {Math.round(metrics.healthScore)}
                  <span className="text-xs font-normal text-[#7B827E]">/100</span>
                </span>
                <span className="text-[10px] font-bold text-[#27834A]">
                  {metrics.riskLevel === 'low' ? 'Optimal' : metrics.riskLevel === 'medium' ? 'Fair' : 'At Risk'}
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F0F2EE]">
              {categoryChartData.slice(0, 4).map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-1.5 rounded-lg bg-[#F4F5F3]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[#14251F] font-medium truncate">{cat.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-[#14251F]">₹{cat.amount}</span>
                </div>
              ))}
            </div>

            {/* Health Factor Explanation Pill */}
            <div className="p-3.5 rounded-2xl bg-[#F1F9E9] border border-[#E5E8E3] text-xs text-[#073B2F]">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#27834A]" />
                <span>Financial Health Diagnosis</span>
              </div>
              <p className="text-[11px] text-[#7B827E] leading-relaxed">
                {metrics.healthFactors[0] || 'All commitments covered with adequate discretionary buffer.'}
              </p>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            COLUMN 3: Signature Simulator + Commitments + Transactions (4.4 cols)
            ═════════════════════════════════════════════════════════════════════ */}
        <div className="md:col-span-2 lg:col-span-4 space-y-6">
          
          {/* Card H: What If You Spend It? — Decision Simulator Preview Sandbox */}
          <div className="bg-white rounded-[26px] p-6 border border-[#E5E8E3] shadow-[0_2px_12px_rgba(20,37,31,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#B7F477] text-[#073B2F] flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#14251F]">What if you spend it?</h2>
                  <p className="text-[11px] text-[#7B827E]">Simulate consequences before committing</p>
                </div>
              </div>
              <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-[#EAF7E8] text-[#27834A] border border-[#C3E7BF]">
                Live Sandbox
              </span>
            </div>

            {/* Quick Presets Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Headphones ₹2,000', amount: '2000', desc: 'Sony Headphones', cat: 'shopping' as TransactionCategory, type: 'purchase' as DecisionType },
                { label: 'OTT Pass ₹199', amount: '199', desc: 'Netflix Monthly', cat: 'subscription' as TransactionCategory, type: 'subscription' as DecisionType },
                { label: 'Emergency ₹1,500', amount: '1500', desc: 'Doctor Visit & Meds', cat: 'emergency' as TransactionCategory, type: 'emergency' as DecisionType },
                { label: 'Income +₹2,000', amount: '2000', desc: 'Freelance Design Gig', cat: 'income' as TransactionCategory, type: 'income' as DecisionType },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSimAmountRupees(preset.amount);
                    setSimDescription(preset.desc);
                    setSimCategory(preset.cat);
                    setSimType(preset.type);
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F4F5F3] hover:bg-[#B7F477] hover:text-[#073B2F] text-[#14251F] transition-all border border-[#E5E8E3]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Interactive Inputs */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="sim-amount" className="text-[10px] font-bold text-[#7B827E] uppercase block mb-1">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#7B827E]">₹</span>
                    <input
                      id="sim-amount"
                      type="number"
                      min="1"
                      placeholder="e.g. 2000"
                      aria-label="Simulation amount in rupees"
                      value={simAmountRupees}
                      onChange={(e) => setSimAmountRupees(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sim-category" className="text-[10px] font-bold text-[#7B827E] uppercase block mb-1">
                    Category
                  </label>
                  <select
                    id="sim-category"
                    aria-label="Simulation transaction category"
                    value={simCategory}
                    onChange={(e) => setSimCategory(e.target.value as TransactionCategory)}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-medium text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                  >
                    <option value="shopping">Shopping</option>
                    <option value="food">Food & Dining</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="subscription">Subscription</option>
                    <option value="emergency">Emergency</option>
                    <option value="income">Income (+)</option>
                  </select>
                </div>
              </div>

              <div>
                <input
                  id="sim-desc"
                  type="text"
                  placeholder="What are you considering buying?"
                  aria-label="Item description to simulate"
                  value={simDescription}
                  onChange={(e) => setSimDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>
            </div>

            {/* Live Delta Matrix Preview */}
            {simPreview && (
              <div className="p-3.5 rounded-2xl bg-[#F4F5F3] border border-[#E5E8E3] space-y-2 text-xs font-mono animate-fade-in">
                <div className="text-[10px] font-bold text-[#7B827E] uppercase tracking-wider">
                  Hypothetical Impact Preview
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7B827E]">New Liquid Cash:</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-[#A0A6A0] line-through">{formatINR(simPreview.currentCash)}</span>
                    <ArrowRight className="w-3 h-3 text-[#7B827E]" />
                    <span className={simPreview.cashDelta >= 0 ? 'text-[#27834A]' : 'text-[#D94B4B]'}>
                      {formatINR(simPreview.simulatedCash)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7B827E]">Revised Safe Daily:</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-[#A0A6A0] line-through">{formatINR(simPreview.currentDaily)}/d</span>
                    <ArrowRight className="w-3 h-3 text-[#7B827E]" />
                    <span className={simPreview.dailyDelta >= 0 ? 'text-[#27834A]' : 'text-[#D94B4B]'}>
                      {formatINR(simPreview.simulatedDaily)}/d
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7B827E]">Month-End Forecast:</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-[#A0A6A0] line-through">{formatINR(simPreview.currentClosing)}</span>
                    <ArrowRight className="w-3 h-3 text-[#7B827E]" />
                    <span className={simPreview.simulatedClosing >= 0 ? 'text-[#27834A]' : 'text-[#D94B4B]'}>
                      {formatINR(simPreview.simulatedClosing)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#E5E8E3] text-[11px]">
                  <span className="text-[#7B827E]">Risk Rating:</span>
                  <div className="flex items-center gap-1 font-semibold">
                    <span className="uppercase text-[#A0A6A0]">{simPreview.currentRisk}</span>
                    <ArrowRight className="w-3 h-3 text-[#7B827E]" />
                    <span className={cn('uppercase font-bold', simPreview.simulatedRisk === 'low' ? 'text-[#27834A]' : simPreview.simulatedRisk === 'critical' ? 'text-[#D94B4B]' : 'text-[#C28A24]')}>
                      {simPreview.simulatedRisk}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Feedback Banners */}
            {simFeedback?.applied && (
              <div className="p-2.5 rounded-xl bg-[#EAF7E8] text-[#27834A] text-xs font-semibold flex items-center gap-2 animate-fade-in border border-[#C3E7BF]">
                <Check className="w-4 h-4" />
                <span>Decision applied to live account ledger!</span>
              </div>
            )}
            {simFeedback?.discarded && (
              <div className="p-2.5 rounded-xl bg-[#FDECEC] text-[#D94B4B] text-xs font-semibold flex items-center gap-2 animate-fade-in border border-[#F7C4C4]">
                <XCircle className="w-4 h-4" />
                <span>Hypothetical scenario discarded. State untouched.</span>
              </div>
            )}

            {/* Apply & Discard Controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDiscardSimDecision}
                disabled={!simPreview}
                className="py-2.5 px-3 rounded-xl border border-[#E5E8E3] text-xs font-semibold text-[#7B827E] hover:bg-[#F4F5F3] disabled:opacity-40 transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleApplySimDecision}
                disabled={!simPreview}
                className="py-2.5 px-3 rounded-xl bg-[#073B2F] text-white text-xs font-bold hover:bg-[#0B4A3A] disabled:opacity-40 transition-colors shadow-sm"
              >
                Apply Decision
              </button>
            </div>
          </div>

          {/* Card F: Upcoming Commitments Card */}
          <div className="bg-white rounded-[26px] p-6 border border-[#E5E8E3] shadow-[0_2px_12px_rgba(20,37,31,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#7B827E] font-semibold tracking-wide uppercase">
                  Upcoming Obligations
                </span>
                <div className="text-base font-bold text-[#14251F] mt-0.5">
                  Bills & Subscriptions
                </div>
              </div>
              <Link
                href="/commitments"
                className="text-xs font-semibold text-[#073B2F] hover:underline flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingCommitments.map((com) => (
                <div
                  key={com.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F5F3] border border-[#E5E8E3] hover:bg-[#F1F9E9] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={com.category} size="sm" />
                    <div>
                      <div className="text-xs font-bold text-[#14251F]">{com.name}</div>
                      <div className="text-[10px] text-[#7B827E] font-mono">
                        Due Day {com.dueDay} • {com.dueDay - store.currentDay}d remaining
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-[#14251F]">
                      {formatINR(com.amount)}
                    </span>
                    <button
                      onClick={() => store.markCommitmentPaid(com.id)}
                      className="p-1.5 rounded-lg bg-white hover:bg-[#B7F477] text-[#073B2F] border border-[#E5E8E3] transition-colors"
                      title="Mark as paid now"
                      aria-label={`Pay ${com.name}`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card G: Recent Transactions Table Card */}
          <div className="bg-white rounded-[26px] p-6 border border-[#E5E8E3] shadow-[0_2px_12px_rgba(20,37,31,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#7B827E] font-semibold tracking-wide uppercase">
                  Activity Feed
                </span>
                <div className="text-base font-bold text-[#14251F] mt-0.5">
                  Recent Transactions
                </div>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-[#073B2F] hover:underline flex items-center gap-0.5"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-[#F0F2EE] last:border-0"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <CategoryIcon category={tx.category} size="sm" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-[#14251F] truncate">{tx.description}</div>
                      <div className="text-[10px] text-[#7B827E] font-mono">Day {tx.day} • {tx.date}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono flex-shrink-0 pl-2">
                    <div
                      className={cn(
                        'text-xs font-bold',
                        tx.type === 'income'
                          ? 'text-[#27834A]'
                          : tx.type === 'transfer'
                          ? 'text-[#073B2F]'
                          : 'text-[#14251F]'
                      )}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '→' : '-'}
                      {formatINR(tx.amount)}
                    </div>
                    <span className="text-[9px] uppercase font-bold text-[#7B827E]">
                      {tx.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ─── Add Transaction Quick Modal ─────────────────────────────────────── */}
      {showAddTxModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-tx-modal-title"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E5E8E3] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F2EE]">
              <div>
                <h3 id="quick-tx-modal-title" className="text-base font-bold text-[#14251F]">Record Transaction</h3>
                <p className="text-xs text-[#7B827E]">Affects live cash, spent totals, and safe daily spend</p>
              </div>
              <button
                onClick={() => setShowAddTxModal(false)}
                className="p-1 rounded-full text-[#7B827E] hover:bg-[#F4F5F3]"
                aria-label="Close dialog"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={cn(
                    'py-2 rounded-xl text-xs font-bold border transition-colors',
                    txType === 'expense'
                      ? 'bg-[#14251F] text-white border-[#14251F]'
                      : 'bg-[#F4F5F3] text-[#7B827E] border-[#E5E8E3]'
                  )}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={cn(
                    'py-2 rounded-xl text-xs font-bold border transition-colors',
                    txType === 'income'
                      ? 'bg-[#27834A] text-white border-[#27834A]'
                      : 'bg-[#F4F5F3] text-[#7B827E] border-[#E5E8E3]'
                  )}
                >
                  Income (+)
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">
                  Amount in Rupees (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100000"
                  required
                  placeholder="e.g. 350"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-sm font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery run (Blinkit)"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">
                  Category
                </label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value as TransactionCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-medium text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                >
                  <option value="food">Food & Dining</option>
                  <option value="transport">Transport</option>
                  <option value="shopping">Shopping</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Housing & Rent</option>
                  <option value="health">Healthcare</option>
                  <option value="income">Income / Inflow</option>
                  <option value="other">Miscellaneous</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E8E3] text-xs font-semibold text-[#7B827E] hover:bg-[#F4F5F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#073B2F] text-white text-xs font-bold hover:bg-[#0B4A3A] shadow-sm"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
