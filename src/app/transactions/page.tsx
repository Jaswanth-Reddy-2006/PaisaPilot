'use client';

import { useState, useEffect } from 'react';
import { useFinanceStore } from '@/store/finance-store';
import { formatINR, rupeesToPaise } from '@/lib/finance/calculations';
import { sanitizeText } from '@/lib/validation/sanitize';
import { PageHeader } from '@/components/ui/Cards';
import { CategoryBadge, CategoryIcon, CATEGORY_CONFIG } from '@/components/ui/CategoryBadge';
import { Plus, Trash2, Filter, Search, ArrowUpRight, ArrowDownRight, Layers, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransactionType, TransactionCategory } from '@/types/finance';
import { useHydrated } from '@/hooks/useHydrated';
import { createSeedData } from '@/lib/finance/seed-data';

const TYPE_FILTERS = [
  { value: 'all', label: 'All Activity' },
  { value: 'income', label: 'Income & Inflow' },
  { value: 'expense', label: 'Discretionary' },
  { value: 'transfer', label: 'Vault Transfers' },
];

export default function TransactionsPage() {
  const store = useFinanceStore();
  const isHydrated = useHydrated();
  const seed = createSeedData();

  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Keyboard navigation: Escape key dismisses modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAdd(false);
      }
    };
    if (showAdd) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showAdd]);

  const [form, setForm] = useState({
    type: 'expense' as TransactionType,
    category: 'food' as TransactionCategory,
    amount: '',
    description: '',
    day: String(store.currentDay),
  });

  const activeTransactions = isHydrated ? store.transactions : seed.transactions;

  const filtered = activeTransactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.day - a.day || a.id.localeCompare(b.id));

  const totalIncome = activeTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = activeTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    const amount = rupeesToPaise(parseFloat(form.amount) || 0);
    const cleanDesc = sanitizeText(form.description);
    if (!amount || !cleanDesc) return;

    store.addTransaction({
      type: form.type,
      category: form.category,
      amount,
      description: cleanDesc,
      date: new Date().toISOString().split('T')[0],
      day: Math.max(1, Math.min(30, parseInt(form.day) || store.currentDay)),
    });
    setShowAdd(false);
    setForm({ type: 'expense', category: 'food', amount: '', description: '', day: String(store.currentDay) });
  }

  // Spending by category
  const categorySpend: Record<string, number> = {};
  activeTransactions.filter(t => t.type === 'expense').forEach(t => {
    categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
  });
  const topCategories = Object.entries(categorySpend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Transaction Ledger"
        subtitle={`${activeTransactions.length} verified operations recorded across 30-day lifecycle`}
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#073B2F] hover:bg-[#0B4A3A] text-white font-bold transition-all text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#B7F477]" />
            <span>Record Transaction</span>
          </button>
        }
      />

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0C1220] border border-[#E5E8E3] rounded-[24px] p-5 shadow-xs">
          <div className="text-[10px] text-[#7B827E] uppercase tracking-wider font-semibold mb-1">
            Total Inflow
          </div>
          <div className="text-2xl font-black text-[#27834A] font-mono">{formatINR(totalIncome)}</div>
          <div className="text-xs text-[#7B827E] mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#27834A]" />
            <span>Budget allocation + extra earnings</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0C1220] border border-[#E5E8E3] rounded-[24px] p-5 shadow-xs">
          <div className="text-[10px] text-[#7B827E] uppercase tracking-wider font-semibold mb-1">
            Total Discretionary Outflow
          </div>
          <div className="text-2xl font-black text-[#14251F] font-mono">{formatINR(totalExpenses)}</div>
          <div className="text-xs text-[#7B827E] mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-[#D94B4B]" />
            <span>Daily food, transport & leisure</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0C1220] border border-[#E5E8E3] rounded-[24px] p-5 shadow-xs">
          <div className="text-[10px] text-[#7B827E] uppercase tracking-wider font-semibold mb-1">
            Net Cashflow Position
          </div>
          <div className="text-2xl font-black text-[#073B2F] dark:text-[#A4E763] font-mono">{formatINR(totalIncome - totalExpenses)}</div>
          <div className="text-xs text-[#7B827E] mt-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#073B2F] dark:text-[#A4E763]" />
            <span>Net cash balance</span>
          </div>
        </div>
      </div>

      {/* Top Categories Row */}
      <div className="bg-white dark:bg-[#0C1220] border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs">
        <div className="text-xs font-bold text-[#14251F] mb-3">Top Discretionary Categories</div>
        <div className="flex flex-wrap gap-2.5">
          {topCategories.map(([cat, amt]) => (
            <div key={cat} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F5F3] border border-[#E5E8E3] text-xs">
              <CategoryBadge category={cat as TransactionCategory} />
              <span className="font-mono font-bold text-[#14251F]">{formatINR(amt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                filterType === f.value
                  ? 'bg-[#14251F] text-white shadow-xs'
                  : 'bg-white dark:bg-[#0C1220] text-[#7B827E] hover:text-[#14251F] border border-[#E5E8E3]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A6A0]" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#0C1220] border border-[#E5E8E3] rounded-full pl-9 pr-4 py-1.5 text-xs text-[#14251F] placeholder:text-[#A0A6A0] focus:outline-none focus:border-[#073B2F]"
          />
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-white dark:bg-[#0C1220] border border-[#E5E8E3] rounded-[26px] p-6 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" role="table">
            <thead>
              <tr className="border-b border-[#F0F2EE] text-[#7B827E] font-semibold">
                <th className="pb-3 pl-2">Operation & Description</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Sim Day</th>
                <th className="pb-3">Type</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2EE]">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-[#F9FAF8] dark:hover:bg-[#12192B] transition-colors group">
                  <td className="py-3 pl-2 font-medium text-[#14251F]">
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon category={t.category} size="sm" />
                      <div>
                        <div className="font-bold text-xs">{t.description}</div>
                        <div className="text-[10px] text-[#7B827E] font-mono">{t.date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <CategoryBadge category={t.category} />
                  </td>
                  <td className="py-3 font-mono font-medium text-[#7B827E]">Day {t.day}</td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        t.type === 'income'
                          ? 'bg-[#EAF7E8] text-[#27834A]'
                          : t.type === 'transfer'
                          ? 'bg-[#E8F7DB] text-[#073B2F]'
                          : 'bg-[#F4F5F3] text-[#7B827E]'
                      )}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-extrabold text-sm">
                    <span
                      className={
                        t.type === 'income'
                          ? 'text-[#27834A]'
                          : t.type === 'transfer'
                          ? 'text-[#073B2F] dark:text-[#A4E763]'
                          : 'text-[#14251F]'
                      }
                    >
                      {t.type === 'income' ? '+' : t.type === 'transfer' ? '→' : '-'}
                      {formatINR(t.amount)}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <button
                      onClick={() => store.deleteTransaction(t.id)}
                      className="p-1.5 rounded-lg text-[#A0A6A0] hover:text-[#D94B4B] hover:bg-[#FDECEC] transition-colors"
                      title="Delete entry"
                      aria-label={`Delete ${t.description}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-tx-title"
        >
          <div className="bg-white dark:bg-[#0C1220] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E5E8E3] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F2EE]">
              <div>
                <h3 id="record-tx-title" className="text-base font-bold text-[#14251F]">Record Transaction</h3>
                <p className="text-xs text-[#7B827E]">Sanitized entry added to 30-day simulation</p>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                aria-label="Close record transaction dialog"
                className="p-1 rounded-full text-[#7B827E] hover:bg-[#F4F5F3]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addTransaction} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
                  className={cn(
                    'py-2 rounded-xl text-xs font-bold border transition-colors',
                    form.type === 'expense'
                      ? 'bg-[#14251F] text-white border-[#14251F]'
                      : 'bg-[#F4F5F3] text-[#7B827E] border-[#E5E8E3]'
                  )}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'income' }))}
                  className={cn(
                    'py-2 rounded-xl text-xs font-bold border transition-colors',
                    form.type === 'income'
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
                  placeholder="350"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
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
                  placeholder="e.g. Zomato dinner"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-[#14251F] block mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as TransactionCategory }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-medium text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                  >
                    {(Object.entries(CATEGORY_CONFIG) as [TransactionCategory, typeof CATEGORY_CONFIG[TransactionCategory]][]).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#14251F] block mb-1">
                    Simulation Day (1-30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.day}
                    onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E8E3] bg-[#F4F5F3] text-xs font-mono font-bold text-[#14251F] focus:bg-white focus:outline-none focus:border-[#073B2F]"
                  />
                </div>
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
