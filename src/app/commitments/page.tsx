'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/store/finance-store';
import { formatINR, rupeesToPaise } from '@/lib/finance/calculations';
import { sanitizeText } from '@/lib/validation/sanitize';
import { PageHeader } from '@/components/ui/Cards';
import { CategoryIcon, CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import { Plus, Trash2, CheckCircle2, Clock, AlertCircle, Pause, Play, CalendarClock, ShieldCheck, XCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransactionCategory, CommitmentStatus } from '@/types/finance';

import { useHydrated } from '@/hooks/useHydrated';
import { createSeedData } from '@/lib/finance/seed-data';

export default function CommitmentsPage() {
  const store = useFinanceStore();
  const isHydrated = useHydrated();
  const seed = createSeedData();

  const activeCommitments = isHydrated ? store.commitments : seed.commitments;
  const activeSubscriptions = isHydrated ? store.subscriptions : seed.subscriptions;
  const activeCurrentDay = isHydrated ? store.currentDay : seed.currentDay;

  const [activeTab, setActiveTab] = useState<'commitments' | 'subscriptions'>('commitments');
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);

  const [commitForm, setCommitForm] = useState({
    name: '',
    category: 'utilities' as TransactionCategory,
    amount: '',
    dueDay: String(store.currentDay),
  });

  const [subForm, setSubForm] = useState({
    name: '',
    category: 'subscription' as TransactionCategory,
    amount: '',
    billingDay: String(store.currentDay),
  });

  function addCommitment(e: React.FormEvent) {
    e.preventDefault();
    const amount = rupeesToPaise(parseFloat(commitForm.amount) || 0);
    const cleanName = sanitizeText(commitForm.name);
    if (!amount || !cleanName) return;

    store.addCommitment({
      name: cleanName,
      category: commitForm.category,
      amount,
      dueDay: Math.max(1, Math.min(30, parseInt(commitForm.dueDay) || store.currentDay)),
      status: 'upcoming',
      isRecurring: true,
      recurringFrequency: 'monthly',
    });
    setShowAddCommitment(false);
    setCommitForm({ name: '', category: 'utilities', amount: '', dueDay: String(store.currentDay) });
  }

  function addSubscription(e: React.FormEvent) {
    e.preventDefault();
    const amount = rupeesToPaise(parseFloat(subForm.amount) || 0);
    const cleanName = sanitizeText(subForm.name);
    if (!amount || !cleanName) return;

    store.addSubscription({
      name: cleanName,
      category: subForm.category,
      amount,
      billingDay: Math.max(1, Math.min(30, parseInt(subForm.billingDay) || store.currentDay)),
      isActive: true,
      isPaused: false,
    });
    setShowAddSub(false);
    setSubForm({ name: '', category: 'subscription', amount: '', billingDay: String(store.currentDay) });
  }

  const statusConfig: Record<CommitmentStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
    upcoming: { label: 'Reserved', icon: Clock, color: 'text-[#C28A24]', bg: 'bg-[#FFF4D9] border-[#FFE0A3]' },
    paid: { label: 'Paid & Settled', icon: CheckCircle2, color: 'text-[#27834A]', bg: 'bg-[#EAF7E8] border-[#C3E7BF]' },
    overdue: { label: 'Overdue', icon: AlertCircle, color: 'text-[#D94B4B]', bg: 'bg-[#FDECEC] border-[#F7C4C4]' },
  };

  const totalCommitmentsReserved = activeCommitments
    .filter(c => c.status === 'upcoming')
    .reduce((s, c) => s + c.amount, 0);

  const totalSubsCost = activeSubscriptions
    .filter(s => s.isActive && !s.isPaused)
    .reduce((s, sub) => s + sub.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Bills & Subscriptions"
        subtitle="Manage upcoming obligations protected from spendable allowance without double-counting cash"
        action={
          <button
            onClick={() => (activeTab === 'commitments' ? setShowAddCommitment(true) : setShowAddSub(true))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#073B2F] hover:bg-[#0B4A3A] text-white font-bold transition-all text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#B7F477]" />
            <span>{activeTab === 'commitments' ? 'Add Obligation' : 'Add Subscription'}</span>
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E5E8E3] rounded-[24px] p-5 shadow-xs">
          <div className="text-[10px] text-[#7B827E] uppercase tracking-wider font-semibold mb-1">
            Total Bills Protected
          </div>
          <div className="text-2xl font-black text-[#14251F] font-mono">{formatINR(totalCommitmentsReserved)}</div>
          <div className="text-xs text-[#7B827E] mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#27834A]" />
            <span>Reserved from liquid cash to guarantee payment</span>
          </div>
        </div>

        <div className="bg-white border border-[#E5E8E3] rounded-[24px] p-5 shadow-xs">
          <div className="text-[10px] text-[#7B827E] uppercase tracking-wider font-semibold mb-1">
            Active Subscriptions Burn
          </div>
          <div className="text-2xl font-black text-[#073B2F] font-mono">{formatINR(totalSubsCost)}/mo</div>
          <div className="text-xs text-[#7B827E] mt-1 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-[#073B2F]" />
            <span>Recurring recurring monthly digital plans</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('commitments')}
          className={cn(
            'px-5 py-2 rounded-full text-xs font-bold transition-all',
            activeTab === 'commitments'
              ? 'bg-[#14251F] text-white shadow-xs'
              : 'bg-white text-[#7B827E] hover:text-[#14251F] border border-[#E5E8E3]'
          )}
        >
          Scheduled Bills & Rent ({activeCommitments.length})
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={cn(
            'px-5 py-2 rounded-full text-xs font-bold transition-all',
            activeTab === 'subscriptions'
              ? 'bg-[#14251F] text-white shadow-xs'
              : 'bg-white text-[#7B827E] hover:text-[#14251F] border border-[#E5E8E3]'
          )}
        >
          Recurring Subscriptions ({activeSubscriptions.length})
        </button>
      </div>

      {/* Commitments Tab Content */}
      {activeTab === 'commitments' && (
        <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold text-[#14251F]">Scheduled Obligations</div>
          <div className="space-y-3">
            {activeCommitments.map(com => {
              const status = statusConfig[com.status];
              const StatusIcon = status.icon;
              const daysUntil = com.dueDay - activeCurrentDay;
              const isDueToday = com.dueDay === activeCurrentDay;

              return (
                <div
                  key={com.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#F4F5F3] border border-[#E5E8E3] hover:bg-[#F1F9E9] transition-colors gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <CategoryIcon category={com.category} size="md" />
                    <div>
                      <div className="font-bold text-sm text-[#14251F]">{com.name}</div>
                      <div className="text-xs text-[#7B827E] font-mono mt-0.5">
                        Due on Day {com.dueDay} of 30 •{' '}
                        {isDueToday ? (
                          <span className="text-[#C28A24] font-bold">Due today</span>
                        ) : daysUntil > 0 ? (
                          <span>In {daysUntil} days</span>
                        ) : (
                          <span className="text-[#D94B4B] font-bold">Day passed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
                    <span className="text-base font-black text-[#14251F]">{formatINR(com.amount)}</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border',
                        status.bg,
                        status.color
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>

                    {com.status === 'upcoming' && (
                      <button
                        onClick={() => store.markCommitmentPaid(com.id)}
                        className="px-3 py-1.5 rounded-full bg-[#073B2F] hover:bg-[#0B4A3A] text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                        title="Deducts cash and converts to expense"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Pay</span>
                      </button>
                    )}

                    <button
                      onClick={() => store.deleteCommitment(com.id)}
                      className="p-1.5 rounded-lg text-[#A0A6A0] hover:text-[#D94B4B] hover:bg-[#FDECEC] transition-colors"
                      title="Remove bill"
                      aria-label={`Delete ${com.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscriptions Tab Content */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs space-y-4">
          <div className="text-xs font-bold text-[#14251F]">Monthly Digital Subscriptions</div>
          <div className="space-y-3">
            {activeSubscriptions.map(sub => (
              <div
                key={sub.id}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-colors gap-3',
                  sub.isPaused
                    ? 'bg-[#F4F5F3]/60 border-[#E5E8E3] opacity-60'
                    : 'bg-[#F4F5F3] border-[#E5E8E3] hover:bg-[#F1F9E9]'
                )}
              >
                <div className="flex items-center gap-3.5">
                  <CategoryIcon category={sub.category} size="md" />
                  <div>
                    <div className="font-bold text-sm text-[#14251F]">{sub.name}</div>
                    <div className="text-xs text-[#7B827E] font-mono mt-0.5">
                      Billed on Day {sub.billingDay} • Monthly charge
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
                  <span className="text-base font-black text-[#14251F]">{formatINR(sub.amount)}/mo</span>
                  <button
                    onClick={() => store.toggleSubscriptionPause(sub.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-colors',
                      sub.isPaused
                        ? 'bg-[#FFF4D9] text-[#C28A24] border-[#FFE0A3]'
                        : 'bg-[#EAF7E8] text-[#27834A] border-[#C3E7BF]'
                    )}
                  >
                    {sub.isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
                    <span>{sub.isPaused ? 'Paused' : 'Active'}</span>
                  </button>

                  <button
                    onClick={() => store.deleteSubscription(sub.id)}
                    className="p-1.5 rounded-lg text-[#A0A6A0] hover:text-[#D94B4B] hover:bg-[#FDECEC] transition-colors"
                    title="Cancel subscription"
                    aria-label={`Delete ${sub.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Commitment Modal */}
      {showAddCommitment && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E5E8E3] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F2EE]">
              <div>
                <h3 className="text-base font-bold text-[#14251F]">Add Scheduled Bill</h3>
                <p className="text-xs text-[#7B827E]">Reserved from spendable balance automatically</p>
              </div>
              <button onClick={() => setShowAddCommitment(false)} className="p-1 rounded-full text-[#7B827E] hover:bg-[#F4F5F3]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addCommitment} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">Bill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WiFi Bill"
                  value={commitForm.name}
                  onChange={e => setCommitForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="300"
                  value={commitForm.amount}
                  onChange={e => setCommitForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-sm font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#14251F] block mb-1">Category</label>
                  <select
                    value={commitForm.category}
                    onChange={e => setCommitForm(f => ({ ...f, category: e.target.value as TransactionCategory }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-medium text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                  >
                    {(Object.entries(CATEGORY_CONFIG) as [TransactionCategory, typeof CATEGORY_CONFIG[TransactionCategory]][]).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#14251F] block mb-1">Due Day (1-30)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={commitForm.dueDay}
                    onChange={e => setCommitForm(f => ({ ...f, dueDay: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCommitment(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E8E3] text-xs font-semibold text-[#7B827E] hover:bg-[#F4F5F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#073B2F] text-white text-xs font-bold hover:bg-[#0B4A3A] shadow-sm"
                >
                  Add Obligation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddSub && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E5E8E3] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F2EE]">
              <div>
                <h3 className="text-base font-bold text-[#14251F]">Add Subscription</h3>
                <p className="text-xs text-[#7B827E]">Recurring monthly digital services</p>
              </div>
              <button onClick={() => setShowAddSub(false)} className="p-1 rounded-full text-[#7B827E] hover:bg-[#F4F5F3]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addSubscription} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. YouTube Premium"
                  value={subForm.name}
                  onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">Monthly Cost (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="129"
                  value={subForm.amount}
                  onChange={e => setSubForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-sm font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14251F] block mb-1">Billing Day (1-30)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={subForm.billingDay}
                  onChange={e => setSubForm(f => ({ ...f, billingDay: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSub(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5E8E3] text-xs font-semibold text-[#7B827E] hover:bg-[#F4F5F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#073B2F] text-white text-xs font-bold hover:bg-[#0B4A3A] shadow-sm"
                >
                  Add Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
