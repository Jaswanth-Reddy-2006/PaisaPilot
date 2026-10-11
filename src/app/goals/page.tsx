'use client';

import { useState, useEffect } from 'react';
import { useFinanceStore } from '@/store/finance-store';
import { formatINR, rupeesToPaise } from '@/lib/finance/calculations';
import { PageHeader, ProgressRing } from '@/components/ui/Cards';
import { Plus, Trash2, PiggyBank, Target, ArrowUpRight, ArrowDownRight, Zap, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { sanitizeText } from '@/lib/validation/sanitize';
import { useHydrated } from '@/hooks/useHydrated';
import { createSeedData } from '@/lib/finance/seed-data';

const GOAL_COLORS = ['#073B2F', '#27834A', '#A4E763', '#C28A24', '#14251F', '#477C73'];

export default function GoalsPage() {
  const store = useFinanceStore();
  const isHydrated = useHydrated();
  const seed = createSeedData();

  const activeGoals = isHydrated ? store.savingsGoals : seed.savingsGoals;
  const activeCurrentDay = isHydrated ? store.currentDay : seed.currentDay;
  const [showAdd, setShowAdd] = useState(false);
  const [modalGoalId, setModalGoalId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'contribute' | 'withdraw'>('contribute');
  const [amountInput, setAmountInput] = useState('');

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAdd(false);
        setModalGoalId(null);
      }
    };
    if (showAdd || modalGoalId) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showAdd, modalGoalId]);

  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    description: '',
    color: GOAL_COLORS[0],
    targetDay: '30',
  });

  function addGoal(e: React.FormEvent) {
    e.preventDefault();
    const target = rupeesToPaise(parseFloat(form.targetAmount) || 0);
    const current = rupeesToPaise(parseFloat(form.currentAmount) || 0);
    const cleanName = sanitizeText(form.name);
    const cleanDesc = sanitizeText(form.description);
    if (!target || !cleanName) return;

    store.addSavingsGoal({
      name: cleanName,
      targetAmount: target,
      currentAmount: current,
      deadline: `2024-01-${String(parseInt(form.targetDay) || 30).padStart(2, '0')}`,
      targetDay: Math.max(1, Math.min(30, parseInt(form.targetDay) || 30)),
      description: cleanDesc,
      color: form.color,
    });
    setShowAdd(false);
    setForm({ name: '', targetAmount: '', currentAmount: '0', description: '', color: GOAL_COLORS[0], targetDay: '30' });
  }

  function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!modalGoalId) return;
    const amount = rupeesToPaise(parseFloat(amountInput) || 0);
    if (!amount) return;

    if (modalMode === 'contribute') {
      store.contributeToGoal(modalGoalId, amount);
    } else {
      store.contributeToGoal(modalGoalId, -amount);
    }

    setModalGoalId(null);
    setAmountInput('');
  }

  const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = activeGoals.reduce((s, g) => s + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const activeGoal = activeGoals.find(g => g.id === modalGoalId);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Savings Goals & Vault"
        subtitle="Manage targeted savings reserves without double-counting your cash"
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#073B2F] hover:bg-[#0B4A3A] text-white font-bold transition-all text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#B7F477]" />
            <span>New Savings Goal</span>
          </button>
        }
      />

      {/* Overall Progress Banner */}
      {activeGoals.length > 0 && (
        <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-6">
            <ProgressRing
              progress={overallProgress}
              size={84}
              strokeWidth={8}
              color="#073B2F"
              trackColor="#E8E8E6"
            >
              <span className="text-sm font-black text-[#073B2F] font-mono">{Math.round(overallProgress)}%</span>
            </ProgressRing>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#7B827E] font-semibold">Total Savings Vault</div>
              <div className="text-3xl font-black text-[#14251F] font-mono mt-0.5">
                {formatINR(totalCurrent)} <span className="text-sm font-normal text-[#7B827E]">of {formatINR(totalTarget)}</span>
              </div>
              <div className="text-xs text-[#7B827E] mt-1 font-medium">
                {activeGoals.length} active savings targets tracked
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col sm:items-end">
            <span className="text-xs text-[#7B827E] font-medium">Remaining Shortfall</span>
            <span className="text-lg font-mono font-black text-[#D94B4B]">{formatINR(Math.max(0, totalTarget - totalCurrent))}</span>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeGoals.map(goal => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const isComplete = goal.currentAmount >= goal.targetAmount;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const daysLeft = Math.max(1, goal.targetDay - activeCurrentDay);
          const dailyRequired = Math.ceil(remaining / daysLeft);

          return (
            <div
              key={goal.id}
              className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                      style={{ backgroundColor: goal.color }}
                    >
                      <PiggyBank className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-[#14251F]">{goal.name}</div>
                      {goal.description && <div className="text-xs text-[#7B827E]">{goal.description}</div>}
                    </div>
                  </div>

                  <button
                    onClick={() => store.deleteSavingsGoal(goal.id)}
                    className="p-1.5 rounded-lg text-[#A0A6A0] hover:text-[#D94B4B] hover:bg-[#FDECEC] transition-colors"
                    title="Delete goal"
                    aria-label={`Delete ${goal.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Ring and Amounts */}
                <div className="flex items-center gap-5 my-4 p-4 rounded-2xl bg-[#F4F5F3] border border-[#E5E8E3]">
                  <ProgressRing
                    progress={progress}
                    size={68}
                    strokeWidth={6}
                    color={goal.color}
                    trackColor="#E8E8E6"
                  >
                    <span className="text-xs font-bold text-[#14251F] font-mono">{Math.round(progress)}%</span>
                  </ProgressRing>

                  <div className="flex-1 space-y-1 font-mono">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#7B827E]">Saved:</span>
                      <span className="font-bold text-[#14251F]">{formatINR(goal.currentAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#7B827E]">Target:</span>
                      <span className="font-bold text-[#14251F]">{formatINR(goal.targetAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-[#E5E8E3]">
                      <span className="text-[#7B827E]">Need:</span>
                      <span className="font-bold text-[#D94B4B]">{formatINR(remaining)}</span>
                    </div>
                  </div>
                </div>

                {/* Pace Indicator */}
                {!isComplete && (
                  <div className="text-xs text-[#7B827E] mb-4 flex items-center justify-between font-mono">
                    <span>Deadline: Day {goal.targetDay}</span>
                    <span className="font-bold text-[#073B2F] bg-[#F1F9E9] px-2.5 py-0.5 rounded-full border border-[#E5E8E3]">
                      Save {formatINR(dailyRequired)}/day
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#F0F2EE]">
                <button
                  onClick={() => {
                    setModalGoalId(goal.id);
                    setModalMode('contribute');
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#073B2F] hover:bg-[#0B4A3A] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  + Deposit
                </button>
                <button
                  onClick={() => {
                    setModalGoalId(goal.id);
                    setModalMode('withdraw');
                  }}
                  disabled={goal.currentAmount <= 0}
                  className="flex-1 py-2 rounded-xl bg-[#F4F5F3] hover:bg-[#E8E8E6] text-[#7B827E] hover:text-[#14251F] border border-[#E5E8E3] text-xs font-bold disabled:opacity-40 transition-colors"
                >
                  Withdraw
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Dialog Modal */}
      {modalGoalId && activeGoal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E5E8E3] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F2EE]">
              <div>
                <h3 id="transfer-modal-title" className="text-base font-bold text-[#14251F]">
                  {modalMode === 'contribute' ? 'Deposit to Goal' : 'Withdraw to Cash'}
                </h3>
                <p className="text-xs text-[#7B827E]">{activeGoal.name}</p>
              </div>
              <button onClick={() => setModalGoalId(null)} aria-label="Close transfer modal" className="p-1 rounded-full text-[#7B827E] hover:bg-[#F4F5F3]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 500"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-sm font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalGoalId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E8E3] text-xs font-semibold text-[#7B827E] hover:bg-[#F4F5F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#073B2F] text-white text-xs font-bold hover:bg-[#0B4A3A] shadow-sm"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Dialog Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-goal-title"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E5E8E3] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F2EE]">
              <div>
                <h3 id="create-goal-title" className="text-base font-bold text-[#14251F]">Create Savings Goal</h3>
                <p className="text-xs text-[#7B827E]">Targeted vault with required daily pacing</p>
              </div>
              <button onClick={() => setShowAdd(false)} aria-label="Close create goal dialog" className="p-1 rounded-full text-[#7B827E] hover:bg-[#F4F5F3]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addGoal} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Smartphone"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#14251F] block mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="2500"
                    value={form.targetAmount}
                    onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-sm font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#14251F] block mb-1">Initial Deposit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.currentAmount}
                    onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-sm font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">Target Day (1-30)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.targetDay}
                  onChange={e => setForm(f => ({ ...f, targetDay: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Save for sale discount"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E8E3] text-xs font-semibold text-[#7B827E] hover:bg-[#F4F5F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#073B2F] text-white text-xs font-bold hover:bg-[#0B4A3A] shadow-sm"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
