'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/store/finance-store';
import {
  simulateDecision,
  formatINR,
  rupeesToPaise,
} from '@/lib/finance/calculations';
import { sanitizeText } from '@/lib/validation/sanitize';
import { PageHeader, RiskBadge } from '@/components/ui/Cards';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import {
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  Tv,
  HeartPulse,
  ArrowDownLeft,
  PiggyBank,
  FileText,
  LucideIcon,
  HelpCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransactionCategory, DecisionType, SimulationPreview } from '@/types/finance';

interface SimForm {
  type: DecisionType;
  description: string;
  amount: string;
  category: TransactionCategory;
  isRecurring: boolean;
}

interface DecisionTypeMeta {
  value: DecisionType;
  label: string;
  icon: LucideIcon;
}

const DECISION_TYPES: DecisionTypeMeta[] = [
  { value: 'purchase', label: 'One-time Purchase', icon: ShoppingBag },
  { value: 'subscription', label: 'New Subscription', icon: Tv },
  { value: 'emergency', label: 'Unexpected Expense / Emergency', icon: HeartPulse },
  { value: 'income', label: 'Extra Income', icon: ArrowDownLeft },
  { value: 'savings', label: 'Savings Contribution', icon: PiggyBank },
  { value: 'bill', label: 'Add / Pay Bill', icon: FileText },
];

const PRESETS = [
  {
    title: 'Buy ₹2,000 Headphones',
    type: 'purchase' as DecisionType,
    amount: '2000',
    category: 'shopping' as TransactionCategory,
    description: 'Noise Cancelling Headphones',
    isRecurring: false,
    badge: 'Popular',
    icon: ShoppingBag,
  },
  {
    title: 'Simulate Unexpected Expense',
    type: 'emergency' as DecisionType,
    amount: '1200',
    category: 'transport' as TransactionCategory,
    description: 'Unexpected Vehicle Breakdown Repair',
    isRecurring: false,
    badge: 'Unexpected',
    icon: AlertTriangle,
  },
  {
    title: 'Add ₹499 OTT Subscription',
    type: 'subscription' as DecisionType,
    amount: '499',
    category: 'subscription' as TransactionCategory,
    description: 'Streaming Entertainment Plan',
    isRecurring: true,
    badge: 'Recurring',
    icon: Tv,
  },
  {
    title: 'Handle ₹1,500 Medical Emergency',
    type: 'emergency' as DecisionType,
    amount: '1500',
    category: 'health' as TransactionCategory,
    description: 'Dental Checkup & Medicine',
    isRecurring: false,
    badge: 'Urgent',
    icon: HeartPulse,
  },
  {
    title: 'Receive ₹2,000 Extra Income',
    type: 'income' as DecisionType,
    amount: '2000',
    category: 'income' as TransactionCategory,
    description: 'Freelance Design Gig',
    isRecurring: false,
    badge: 'Inflow',
    icon: ArrowDownLeft,
  },
  {
    title: 'Save an Extra ₹500',
    type: 'savings' as DecisionType,
    amount: '500',
    category: 'savings' as TransactionCategory,
    description: 'Transfer to Emergency Vault',
    isRecurring: false,
    badge: 'Growth',
    icon: PiggyBank,
  },
];

export default function SimulatePage() {
  const store = useFinanceStore();
  const currentMetrics = store.getMetrics();

  const [form, setForm] = useState<SimForm>({
    type: 'purchase',
    description: '',
    amount: '',
    category: 'shopping',
    isRecurring: false,
  });

  const [preview, setPreview] = useState<SimulationPreview | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'applied' | 'discarded'; message: string } | null>(null);

  const runSimulation = (customForm?: SimForm) => {
    const f = customForm || form;
    const amountNum = parseFloat(f.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const simDecision = {
      type: f.type,
      amount: rupeesToPaise(amountNum),
      description: f.description || `${f.type} scenario`,
      category: f.category,
      isRecurring: f.isRecurring,
      day: store.currentDay,
    };

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

    const result = simulateDecision(currentState, simDecision);
    setPreview(result);
    setFeedback(null);
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const newForm: SimForm = {
      type: preset.type,
      amount: preset.amount,
      description: preset.description,
      category: preset.category,
      isRecurring: preset.isRecurring,
    };
    setForm(newForm);
    runSimulation(newForm);
  };

  const handleApply = () => {
    if (!preview || !preview.decision.amount) return;

    const cleanDesc = sanitizeText(form.description);
    store.applyDecision({
      type: form.type,
      description: cleanDesc || `${form.type} expense`,
      amount: preview.decision.amount,
      category: form.category,
      isRecurring: form.isRecurring,
      day: store.currentDay,
    });

    setFeedback({
      type: 'applied',
      message: `Applied "${form.description || form.type}" of ${formatINR(preview.decision.amount)} to live ledger!`,
    });
    setPreview(null);
    setForm({ type: 'purchase', description: '', amount: '', category: 'shopping', isRecurring: false });
  };

  const handleDiscard = () => {
    setPreview(null);
    setForm({ type: 'purchase', description: '', amount: '', category: 'shopping', isRecurring: false });
    setFeedback({
      type: 'discarded',
      message: 'Hypothetical scenario discarded. Live state remains 100% untouched.',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Decision Simulator"
        subtitle="Simulate financial actions before committing — preview impacts on cash, safe daily limit, and commitments."
      />

      {/* Preset Cards Row */}
      <div className="bg-white rounded-[26px] p-6 border border-[#E5E8E3] shadow-[0_2px_12px_rgba(20,37,31,0.04)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#27834A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#14251F]">
              Instant Scenario Presets
            </span>
          </div>
          <span className="text-xs text-[#7B827E]">1-click preview with zero commitment</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESETS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                onClick={() => handlePresetClick(p)}
                className="text-left p-3.5 rounded-2xl bg-[#F4F5F3] hover:bg-[#F1F9E9] border border-[#E5E8E3] hover:border-[#A4E763] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-[#14251F] border border-[#E5E8E3] group-hover:bg-[#B7F477] group-hover:text-[#073B2F]">
                      {p.badge}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-[#7B827E] group-hover:text-[#073B2F] transition-colors" />
                  </div>
                  <div className="text-xs font-bold text-[#14251F] line-clamp-2">
                    {p.title}
                  </div>
                </div>
                <div className="text-[11px] text-[#27834A] font-mono font-bold mt-2.5 flex items-center gap-1">
                  <span>Preview</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            'flex items-center justify-between p-4 rounded-2xl text-xs sm:text-sm border transition-all animate-fade-in',
            feedback.type === 'applied'
              ? 'bg-[#EAF7E8] border-[#C3E7BF] text-[#27834A]'
              : 'bg-[#F4F5F3] border-[#E5E8E3] text-[#7B827E]'
          )}
          role="status"
        >
          <div className="flex items-center gap-2.5 font-semibold">
            {feedback.type === 'applied' ? (
              <Check className="w-5 h-5 text-[#27834A] stroke-[2.5]" />
            ) : (
              <RotateCcw className="w-5 h-5 text-[#7B827E]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold text-[#14251F] hover:underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two Column Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Decision Config (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-[26px] p-6 border border-[#E5E8E3] shadow-[0_2px_12px_rgba(20,37,31,0.04)] space-y-4">
            <span className="text-xs text-[#7B827E] uppercase tracking-wider font-bold block">
              1. Decision Category
            </span>

            <div className="grid grid-cols-2 gap-2">
              {DECISION_TYPES.map(dt => {
                const Icon = dt.icon;
                const isSelected = form.type === dt.value;
                return (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: dt.value }))}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition-all border',
                      isSelected
                        ? 'border-[#073B2F] bg-[#F1F9E9] text-[#073B2F] font-bold shadow-xs'
                        : 'border-[#E5E8E3] bg-[#F4F5F3] text-[#7B827E] hover:text-[#14251F]'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isSelected ? 'text-[#073B2F]' : 'text-[#7B827E]')} />
                    <span>{dt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#F0F2EE] space-y-3.5">
              <span className="text-xs text-[#7B827E] uppercase tracking-wider font-bold block">
                2. Parameters
              </span>

              <div>
                <label className="text-xs font-semibold text-[#14251F] mb-1.5 block">
                  Description / Item Name
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Sony Wireless Headphones"
                  className="w-full bg-[#F4F5F3] border border-[#E5E8E3] rounded-xl px-3.5 py-2.5 text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] mb-1.5 block">
                  Amount in Rupees (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B827E] text-xs font-bold font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="2000"
                    min="1"
                    className="w-full bg-[#F4F5F3] border border-[#E5E8E3] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F] transition-colors font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] mb-1.5 block">
                  Expense Category
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as TransactionCategory }))}
                  className="w-full bg-[#F4F5F3] border border-[#E5E8E3] rounded-xl px-3.5 py-2.5 text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F] transition-colors"
                >
                  {(Object.entries(CATEGORY_CONFIG) as [TransactionCategory, typeof CATEGORY_CONFIG[TransactionCategory]][]).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.type === 'subscription' && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isRecurring: !f.isRecurring }))}
                    className={cn(
                      'w-10 h-5 rounded-full transition-all relative',
                      form.isRecurring ? 'bg-[#27834A]' : 'bg-[#E5E8E3]'
                    )}
                    role="switch"
                    aria-checked={form.isRecurring}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                        form.isRecurring ? 'left-[22px]' : 'left-0.5'
                      )}
                    />
                  </button>
                  <span className="text-xs text-[#14251F] font-medium">Recurring Monthly Charge</span>
                </div>
              )}

              <button
                onClick={() => runSimulation()}
                disabled={!form.amount || parseFloat(form.amount) <= 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#073B2F] hover:bg-[#0B4A3A] text-white font-bold transition-all text-xs shadow-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <Zap className="w-4 h-4 text-[#B7F477]" />
                Preview Connected Impact
              </button>
            </div>
          </div>
        </div>

        {/* Right: Connected Consequences Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!preview ? (
            <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-8 flex flex-col items-center justify-center text-center h-full min-h-[460px] shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#F1F9E9] flex items-center justify-center mb-4 border border-[#A4E763]">
                <Zap className="w-7 h-7 text-[#073B2F]" />
              </div>
              <h3 className="text-base font-bold text-[#14251F] mb-1.5">No Active Simulation</h3>
              <p className="text-xs text-[#7B827E] max-w-sm mb-6 leading-relaxed">
                Click a preset above or enter amounts on the left to see how every financial variable reacts in real time across the shared mathematical engine.
              </p>
              <button
                onClick={() => handlePresetClick(PRESETS[0])}
                className="px-4 py-2.5 rounded-full bg-[#B7F477] hover:bg-[#A4E763] text-[#073B2F] text-xs font-bold transition-colors shadow-xs"
              >
                Try Preset: Buy ₹2,000 Headphones
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0F2EE]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#27834A]">
                    Simulated Scenario
                  </span>
                  <h3 className="text-lg font-extrabold text-[#14251F] mt-0.5">
                    {preview.decision.description || 'Custom Scenario'}
                  </h3>
                </div>
                <div className="text-right font-mono font-black text-xl">
                  <span className={preview.decision.type === 'income' ? 'text-[#27834A]' : 'text-[#D94B4B]'}>
                    {preview.decision.type === 'income' ? '+' : '-'}{formatINR(preview.decision.amount || 0)}
                  </span>
                </div>
              </div>

              {/* 7 Connected Metrics Comparison Rows */}
              <div className="divide-y divide-[#F0F2EE]">
                <ComparisonRow
                  label="Available Liquid Cash"
                  tooltip="Actual funds held"
                  before={formatINR(preview.current.currentCash)}
                  after={formatINR(preview.simulated.currentCash)}
                  delta={preview.deltas.balance}
                />

                <ComparisonRow
                  label="Safe Daily Spend Limit"
                  tooltip="Remaining unreserved cash divided by days remaining"
                  before={`${formatINR(preview.current.safeDailyAllowance)}/d`}
                  after={`${formatINR(preview.simulated.safeDailyAllowance)}/d`}
                  delta={preview.deltas.dailyAllowance}
                />

                <ComparisonRow
                  label="Savings Goal Progress"
                  tooltip="Progress toward ₹3,500 target"
                  before={`${Math.round(preview.current.savingsProgress)}%`}
                  after={`${Math.round(preview.simulated.savingsProgress)}%`}
                  delta={preview.deltas.savingsProgress}
                  isPercentage
                />

                <ComparisonRow
                  label="Month-End Closing"
                  tooltip="Projected balance on Day 30"
                  before={formatINR(preview.current.projectedClosingBalance)}
                  after={formatINR(preview.simulated.projectedClosingBalance)}
                  delta={preview.deltas.closingBalance}
                />

                <div className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[#14251F] font-bold">Financial Risk Rating</div>
                    <div className="text-[10px] text-[#7B827E]">Commitment buffer coverage</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={preview.current.riskLevel} />
                    <ArrowRight className="w-3.5 h-3.5 text-[#7B827E]" />
                    <RiskBadge level={preview.simulated.riskLevel} />
                  </div>
                </div>

                <ComparisonRow
                  label="Financial Health Score"
                  tooltip="Deterministic 0-100 diagnostic"
                  before={`${Math.round(preview.current.healthScore)} / 100`}
                  after={`${Math.round(preview.simulated.healthScore)} / 100`}
                  delta={preview.deltas.healthScore}
                  isScore
                />
              </div>

              {/* Warnings and Insights */}
              {preview.warnings.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#FDECEC] border border-[#F7C4C4] space-y-1.5">
                  {preview.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#D94B4B] font-medium">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {preview.insights.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#F1F9E9] border border-[#E5E8E3] space-y-1.5">
                  {preview.insights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#073B2F] font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#27834A] flex-shrink-0 mt-0.5" />
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Apply / Discard Actions */}
              <div className="flex gap-3 pt-3 border-t border-[#F0F2EE]">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="flex-1 py-3 rounded-full border border-[#E5E8E3] hover:bg-[#F4F5F3] text-xs font-bold text-[#7B827E] transition-colors"
                >
                  Discard Scenario
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-3 rounded-full bg-[#073B2F] hover:bg-[#0B4A3A] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Apply Decision to Ledger
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ComparisonRowProps {
  label: string;
  tooltip: string;
  before: string;
  after: string;
  delta: number;
  isPercentage?: boolean;
  isScore?: boolean;
}

function ComparisonRow({
  label,
  tooltip,
  before,
  after,
  delta,
  isPercentage = false,
  isScore = false,
}: ComparisonRowProps) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  const formattedDelta = isNeutral
    ? '±0'
    : isPercentage
    ? `${isPositive ? '+' : ''}${Math.round(delta)}%`
    : isScore
    ? `${isPositive ? '+' : ''}${Math.round(delta)} pts`
    : `${isPositive ? '+' : '-'}${formatINR(Math.abs(delta))}`;

  return (
    <div className="py-2.5 flex items-center justify-between text-xs">
      <div>
        <div className="text-[#14251F] font-bold">{label}</div>
        <div className="text-[10px] text-[#7B827E]">{tooltip}</div>
      </div>
      <div className="flex items-center gap-3 font-mono">
        <span className="text-[#7B827E] line-through text-[11px]">{before}</span>
        <ArrowRight className="w-3 h-3 text-[#A0A6A0]" />
        <span className="text-[#14251F] font-bold text-xs">{after}</span>
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
            isNeutral
              ? 'bg-[#F4F5F3] text-[#7B827E] border-[#E5E8E3]'
              : isPositive
              ? 'bg-[#EAF7E8] text-[#27834A] border-[#C3E7BF]'
              : 'bg-[#FDECEC] text-[#D94B4B] border-[#F7C4C4]'
          )}
        >
          {formattedDelta}
        </span>
      </div>
    </div>
  );
}
