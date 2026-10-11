'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Zap,
  ArrowLeftRight,
  CalendarDays,
  Target,
  LineChart,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceStore } from '@/store/finance-store';
import { useTheme } from '@/context/ThemeContext';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/simulate', label: 'Decision Simulator', icon: Zap },
  { href: '/transactions', label: 'Transactions Ledger', icon: ArrowLeftRight },
  { href: '/commitments', label: 'Bills & Subscriptions', icon: CalendarDays },
  { href: '/goals', label: 'Savings Goals', icon: Target },
  { href: '/insights', label: 'Financial Insights', icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { resetToDemo } = useFinanceStore();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Desktop Floating Navigation Rail (Matching Fynix Reference) */}
      <aside
        className="hidden md:flex fixed left-5 top-20 bottom-6 w-16 flex-col items-center justify-between z-30 select-none py-2"
        aria-label="Navigation Rail"
      >
        {/* Top: Bright / Dark Mode Toggle Pill */}
        <div className="bg-white rounded-full p-1.5 shadow-[0_2px_8px_rgba(20,37,31,0.04)] border border-[#E5E8E3] flex flex-col items-center gap-1">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
              theme === 'light'
                ? 'bg-[#B7F477] text-[#073B2F] shadow-xs'
                : 'text-[#7B827E] hover:text-[#14251F]'
            )}
            title="Switch to Bright Mode"
            aria-label="Switch to Bright Mode"
          >
            <Sun className="w-4 h-4 stroke-[2.2]" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
              theme === 'dark'
                ? 'bg-[#B7F477] text-[#073B2F] shadow-xs'
                : 'text-[#7B827E] hover:text-[#14251F]'
            )}
            title="Switch to Dark Mode"
            aria-label="Switch to Dark Mode"
          >
            <Moon className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Center: Main Icon Navigation Floating Island */}
        <div className="bg-white rounded-[26px] p-2 shadow-[0_4px_16px_rgba(20,37,31,0.05)] border border-[#E5E8E3] flex flex-col items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <div key={href} className="relative group">
                <Link
                  href={href}
                  className={cn(
                    'w-11 h-11 rounded-[18px] flex items-center justify-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#073B2F]',
                    isActive
                      ? 'bg-[#B7F477] text-[#073B2F] shadow-[0_2px_8px_rgba(164,231,99,0.35)] font-bold scale-105'
                      : 'text-[#7B827E] hover:text-[#14251F] hover:bg-[#F4F5F3]'
                  )}
                  aria-label={label}
                >
                  <Icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', isActive && 'stroke-[2.4]')} />
                </Link>

                {/* Accessible Tooltip */}
                <div className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <div className="bg-[#14251F] dark:bg-[#141A16] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg border border-transparent dark:border-[#1F2821]">
                    {label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom: Reset Action Pill */}
        <div className="bg-white rounded-full p-1.5 shadow-[0_2px_8px_rgba(20,37,31,0.04)] border border-[#E5E8E3]">
          <button
            onClick={() => {
              if (window.confirm('Reset PaisaPilot simulation to Day 8 baseline?')) {
                resetToDemo();
              }
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#7B827E] hover:text-[#D94B4B] hover:bg-[#FDECEC] transition-colors"
            title="Reset Simulation State"
            aria-label="Reset Simulation State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Responsive Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0E120F]/95 backdrop-blur-md border-t border-[#E5E8E3] py-2 px-1 sm:px-4 flex items-center justify-around shadow-lg"
        aria-label="Mobile Navigation"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-xl text-[10px] font-medium transition-all',
                isActive
                  ? 'text-[#073B2F] dark:text-[#A4E763] font-bold'
                  : 'text-[#7B827E] hover:text-[#14251F]'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all',
                  isActive ? 'bg-[#B7F477]' : 'bg-transparent'
                )}
              >
                <Icon className="w-4 h-4 text-current" />
              </div>
              <span className="mt-0.5 text-[9px]">{label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
