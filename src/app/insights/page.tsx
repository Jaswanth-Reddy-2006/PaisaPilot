'use client';

import { useFinanceStore } from '@/store/finance-store';
import { formatINR, calculateMetrics, calculateForecast, generateInsights } from '@/lib/finance/calculations';
import { PageHeader, RiskBadge } from '@/components/ui/Cards';
import { cn } from '@/lib/utils';
import { useHydrated } from '@/hooks/useHydrated';
import { createSeedData } from '@/lib/finance/seed-data';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Info,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function InsightsPage() {
  const store = useFinanceStore();
  const isHydrated = useHydrated();
  const seed = createSeedData();

  const activeTransactions = isHydrated ? store.transactions : seed.transactions;
  const activeCurrentDay = isHydrated ? store.currentDay : seed.currentDay;
  const activeTotalSpent = isHydrated ? store.totalSpent : seed.totalSpent;
  const activeCommitments = isHydrated ? store.commitments : seed.commitments;

  const metrics = isHydrated ? store.getMetrics() : calculateMetrics(seed);
  const forecast = isHydrated ? store.getForecast() : calculateForecast(seed);
  const insights = isHydrated ? store.getInsights() : generateInsights(seed, metrics);

  // Category spend breakdown
  const categoryData: Record<string, number> = {};
  activeTransactions.filter(t => t.type === 'expense').forEach(t => {
    const label = t.category.charAt(0).toUpperCase() + t.category.slice(1);
    categoryData[label] = (categoryData[label] || 0) + Math.round(t.amount / 100);
  });
  const categoryChartData = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, amount]) => ({ name, amount }));

  // Daily spend per day
  const dailyData: { day: string; spent: number; income: number }[] = [];
  for (let d = 1; d <= activeCurrentDay; d++) {
    const dayTxs = activeTransactions.filter(t => t.day === d);
    const spent = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.round(t.amount / 100), 0);
    const income = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Math.round(t.amount / 100), 0);
    if (spent > 0 || income > 0) {
      dailyData.push({ day: `D${d}`, spent, income });
    }
  }

  // Forecast chart data
  const forecastChartData = forecast.map(d => ({
    day: `D${d.day}`,
    balance: Math.round(d.balance / 100),
    isProjected: d.isProjected,
  }));

  const zeroLineDay = forecast.find(d => d.balance <= 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Financial Insights & Forecast"
        subtitle="Mathematical balance projection, risk diagnostics, and algorithm-driven spending insights"
        action={
          <div className="flex items-center gap-2 text-xs font-bold text-[#073B2F] bg-[#F1F9E9] border border-[#E5E8E3] px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#27834A]" />
            <span>Deterministic Forecast</span>
          </div>
        }
      />

      {/* Key Health Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Health Score"
          value={`${Math.round(metrics.healthScore)} / 100`}
          sub={`${metrics.riskLevel.toUpperCase()} RISK`}
          variant={metrics.healthScore >= 70 ? 'lime' : 'default'}
        />
        <StatCard
          label="Discretionary Spent"
          value={formatINR(activeTotalSpent)}
          sub={`${Math.round(metrics.percentDaysPassed)}% of 30-day cycle`}
          variant="default"
        />
        <StatCard
          label="Reserved Bills"
          value={formatINR(metrics.reservedCommitments)}
          sub={`${activeCommitments.filter(c => c.status === 'upcoming').length} upcoming obligations`}
          variant="default"
        />
        <StatCard
          label="Savings Progress"
          value={`${Math.round(metrics.savingsProgress)}%`}
          sub={`${formatINR(metrics.totalSavings)} accumulated`}
          variant="default"
        />
      </div>

      {/* 30-Day Trajectory Area Chart Card */}
      <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-base font-extrabold text-[#14251F]">
              30-Day Balance Trajectory
            </div>
            <div className="text-xs text-[#7B827E]">
              Actual cash through Day {store.currentDay} • Projected daily velocity through Day 30
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-mono font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#073B2F]" />
              <span className="text-[#14251F]">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A4E763]" />
              <span className="text-[#14251F]">Projected</span>
            </div>
            <div className="text-right">
              <span className="text-[#7B827E] text-[10px] block uppercase">Month-End</span>
              <span className={cn('font-black text-sm', metrics.projectedClosingBalance >= 0 ? 'text-[#27834A]' : 'text-[#D94B4B]')}>
                {formatINR(metrics.projectedClosingBalance)}
              </span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="insightsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A4E763" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#A4E763" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E8E3" />
              <XAxis dataKey="day" stroke="#A0A6A0" fontSize={10} tickLine={false} interval={3} />
              <YAxis stroke="#A0A6A0" fontSize={10} tickLine={false} tickFormatter={val => `₹${val}`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#14251F] text-white p-2.5 rounded-xl text-xs font-mono shadow-lg">
                      <div className="font-bold text-[#A4E763]">{d.day}</div>
                      <div>Balance: ₹{d.balance.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-slate-300">
                        {d.isProjected ? 'Projected forecast' : 'Actual historical'}
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="#D94B4B" strokeDasharray="4 4" label={{ value: 'Zero Balance', fill: '#D94B4B', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#073B2F"
                strokeWidth={2.5}
                fill="url(#insightsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Daily Velocity and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spending Velocity Chart */}
        <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs space-y-4">
          <div className="text-sm font-extrabold text-[#14251F]">
            Daily Spending Velocity (Days 1–{store.currentDay})
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E8E3" />
                <XAxis dataKey="day" stroke="#A0A6A0" fontSize={10} tickLine={false} />
                <YAxis stroke="#A0A6A0" fontSize={10} tickLine={false} tickFormatter={val => `₹${val}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#14251F] text-white p-2 rounded-xl text-xs font-mono shadow-md">
                        <div className="font-bold">{d.day}</div>
                        <div className="text-[#D94B4B]">Spent: ₹{d.spent}</div>
                        {d.income > 0 && <div className="text-[#27834A]">Inflow: ₹{d.income}</div>}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="spent" fill="#073B2F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Spending Categories Horizontal Bar */}
        <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs space-y-4">
          <div className="text-sm font-extrabold text-[#14251F]">
            Spending Distribution
          </div>
          <div className="space-y-3 pt-1">
            {categoryChartData.map(cat => {
              const maxSpend = categoryChartData[0]?.amount || 1;
              const percent = Math.round((cat.amount / maxSpend) * 100);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#14251F] font-bold">{cat.name}</span>
                    <span className="font-mono font-bold text-[#14251F]">₹{cat.amount}</span>
                  </div>
                  <div className="h-2 w-full bg-[#F4F5F3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#A4E763] to-[#27834A] rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advisory Insights Card */}
      <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#27834A]" />
          <div className="text-sm font-extrabold text-[#14251F]">Algorithmic Financial Insights</div>
        </div>
        <div className="space-y-2">
          {insights.map((ins, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F4F5F3] text-xs text-[#14251F]">
              <CheckCircle2 className="w-4 h-4 text-[#27834A] flex-shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{ins}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, variant = 'default' }: { label: string; value: string; sub: string; variant?: 'default' | 'lime' }) {
  return (
    <div
      className={cn(
        'p-5 rounded-[22px] border shadow-xs transition-all',
        variant === 'lime'
          ? 'bg-[#B7F477] border-[#A4E763] text-[#073B2F]'
          : 'bg-white border-[#E5E8E3] text-[#14251F]'
      )}
    >
      <div className={cn('text-[11px] font-semibold uppercase tracking-wider', variant === 'lime' ? 'text-[#073B2F]/80' : 'text-[#7B827E]')}>
        {label}
      </div>
      <div className={cn('text-2xl font-black font-mono tracking-tight mt-1', variant === 'lime' ? 'text-[#073B2F]' : 'text-[#14251F]')}>
        {value}
      </div>
      <div className={cn('text-[11px] font-medium mt-1 truncate', variant === 'lime' ? 'text-[#073B2F]/90' : 'text-[#7B827E]')}>
        {sub}
      </div>
    </div>
  );
}
