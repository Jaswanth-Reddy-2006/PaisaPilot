'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Settings,
  HelpCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useFinanceStore } from '@/store/finance-store';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const navPills = [
  { href: '/', label: 'Overview' },
  { href: '/simulate', label: 'Simulator' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/commitments', label: 'Commitments' },
  { href: '/goals', label: 'Goals' },
  { href: '/insights', label: 'Insights' },
];

export function Navbar() {
  const pathname = usePathname();
  const { currentDay, totalDays, setCurrentDay, userName, resetToDemo } = useFinanceStore();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Keyboard navigation: Escape key dismisses modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowResetConfirm(false);
      }
    };
    if (showResetConfirm) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showResetConfirm]);

  const daysRemaining = Math.max(0, totalDays - currentDay);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#E8E8E6]/80 dark:bg-[#050705]/80 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Wordmark with Leaf/Wallet Mark */}
        <div className="flex items-center gap-3">
          <Link href="/" className="focus-visible:ring-2 focus-visible:ring-[#073B2F] rounded-full">
            <Logo size="md" showSubtitle={false} />
          </Link>
        </div>

        {/* Center: Reference-Style Horizontal Navigation Pills */}
        <nav
          className="hidden md:flex items-center gap-1 bg-white/70 dark:bg-[#0E120F]/70 p-1.5 rounded-full border border-[#E5E8E3] shadow-[0_1px_3px_rgba(20,37,31,0.02)]"
          aria-label="Main Navigation"
        >
          {navPills.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-[#14251F] text-white shadow-xs'
                    : 'text-[#7B827E] hover:text-[#14251F] hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Simulation Day Stepper, Search, Theme Toggle, Reset, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* 30-Day Simulation Stepper Pill */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white dark:bg-[#0E120F] px-2 sm:px-2.5 py-1 rounded-full border border-[#E5E8E3] shadow-xs text-[11px] sm:text-xs font-mono">
            <button
              onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
              disabled={currentDay <= 1}
              className="p-1 rounded-full hover:bg-[#F4F5F3] text-[#7B827E] hover:text-[#14251F] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous simulated day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-[#14251F] px-0.5 sm:px-1">
              Day {currentDay} <span className="text-[#A0A6A0] font-normal">/ {totalDays}</span>
            </span>
            <button
              onClick={() => setCurrentDay(Math.min(totalDays, currentDay + 1))}
              disabled={currentDay >= totalDays}
              className="p-1 rounded-full hover:bg-[#F4F5F3] text-[#7B827E] hover:text-[#14251F] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next simulated day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="hidden lg:inline text-[10px] bg-[#EAF7E8] text-[#27834A] font-bold px-2 py-0.5 rounded-full ml-1">
              {daysRemaining}d left
            </span>
          </div>

          {/* Search Box (Fynix Style) */}
          <div className="hidden xl:flex items-center gap-2 bg-white dark:bg-[#0E120F] px-3 py-1.5 rounded-full border border-[#E5E8E3] text-xs text-[#7B827E] shadow-xs focus-within:border-[#073B2F] focus-within:ring-1 focus-within:ring-[#073B2F]">
            <Search className="w-3.5 h-3.5 text-[#A0A6A0]" />
            <input
              type="text"
              placeholder="Search anything"
              aria-label="Search across dashboard"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-28 bg-transparent text-[#14251F] placeholder:text-[#A0A6A0] text-xs focus:outline-none"
            />
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-[#F4F5F3] text-[#7B827E] rounded border border-[#E5E8E3]">
              ⌘F
            </kbd>
          </div>

          {/* Bright / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-[#0E120F] hover:bg-[#F4F5F3] text-[#7B827E] hover:text-[#14251F] border border-[#E5E8E3] shadow-xs transition-colors"
            title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-[#B7F477]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#073B2F]" />
            )}
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-2 rounded-full bg-white dark:bg-[#0E120F] hover:bg-[#F4F5F3] text-[#7B827E] hover:text-[#14251F] border border-[#E5E8E3] shadow-xs transition-colors"
            title="Reset Demo Data"
            aria-label="Reset Demo Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#073B2F] to-[#27834A] flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {userName.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          <div className="bg-white dark:bg-[#0E120F] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E5E8E3] space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF4D9] text-[#C28A24] flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 id="reset-modal-title" className="text-base font-bold text-[#14251F]">Reset Simulation to Day 8?</h3>
              <p className="text-xs text-[#7B827E] mt-1.5 leading-relaxed">
                This will restore all default transactions, bills, savings goals, and ₹10,000 budget metrics.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold border border-[#E5E8E3] text-[#7B827E] hover:bg-[#F4F5F3]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDemo();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-[#D94B4B] text-white hover:bg-[#C23A3A] shadow-sm"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
