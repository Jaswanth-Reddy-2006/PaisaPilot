'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types/finance';
import {
  TrendingUp,
  TrendingDown,
  Wifi,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from 'lucide-react';

/* ─── Metric Card (Fynix / Verda inspired) ────────────────────────────────── */
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendLabel?: string;
  variant?: 'default' | 'lime' | 'forest' | 'subtle';
  className?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  trendLabel,
  variant = 'default',
  className,
  icon,
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-white border-[#E5E8E3] text-[#14251F] shadow-[0_2px_10px_rgba(20,37,31,0.03)]',
    lime: 'bg-[#B7F477] border-[#A4E763] text-[#073B2F] shadow-[0_4px_16px_rgba(164,231,99,0.25)]',
    forest: 'bg-[#073B2F] border-[#073B2F] text-white shadow-[0_4px_16px_rgba(7,59,47,0.2)]',
    subtle: 'bg-[#F4F5F3] border-[#E5E8E3] text-[#14251F]',
  };

  const titleColors = {
    default: 'text-[#7B827E]',
    lime: 'text-[#073B2F]/80 font-semibold',
    forest: 'text-emerald-200/80',
    subtle: 'text-[#7B827E]',
  };

  const valueColors = {
    default: 'text-[#14251F]',
    lime: 'text-[#073B2F]',
    forest: 'text-white',
    subtle: 'text-[#14251F]',
  };

  const subtitleColors = {
    default: 'text-[#7B827E]',
    lime: 'text-[#073B2F]/90 font-medium',
    forest: 'text-emerald-100/70',
    subtle: 'text-[#A0A6A0]',
  };

  return (
    <div
      className={cn(
        'rounded-[20px] p-5 border transition-all duration-200 relative overflow-hidden group hover:translate-y-[-1px] hover:shadow-md',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className={cn('text-xs tracking-tight font-medium', titleColors[variant])}>
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              'p-2 rounded-xl transition-colors',
              variant === 'lime'
                ? 'bg-[#073B2F]/10 text-[#073B2F]'
                : variant === 'forest'
                ? 'bg-white/10 text-white'
                : 'bg-[#F4F5F3] text-[#14251F]'
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className={cn('text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mb-1', valueColors[variant])}>
        {value}
      </div>

      <div
        className={cn(
          'flex items-center justify-between mt-3 pt-2.5 border-t text-xs',
          variant === 'lime'
            ? 'border-[#073B2F]/15'
            : variant === 'forest'
            ? 'border-white/10'
            : 'border-[#F0F2EE]'
        )}
      >
        {subtitle && (
          <span className={cn('truncate max-w-[180px]', subtitleColors[variant])}>
            {subtitle}
          </span>
        )}
        {trend && trendValue && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full',
              variant === 'lime'
                ? 'bg-[#073B2F]/15 text-[#073B2F]'
                : trend === 'up'
                ? 'bg-[#EAF7E8] text-[#27834A] border border-[#C3E7BF]'
                : trend === 'down'
                ? 'bg-[#FDECEC] text-[#D94B4B] border border-[#F7C4C4]'
                : 'bg-[#F4F5F3] text-[#7B827E] border border-[#E5E8E3]'
            )}
          >
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue} {trendLabel && <span className="font-normal opacity-75">{trendLabel}</span>}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Verda-Style Neon & Forest Virtual Debit Card ───────────────────────── */
interface VirtualCardProps {
  balanceFormatted: string;
  userName: string;
  currentDay: number;
  totalDays: number;
  safeDailyFormatted: string;
  cardVariant?: 'lime' | 'forest';
  className?: string;
}

export function VirtualCard({
  balanceFormatted,
  userName,
  currentDay,
  totalDays,
  safeDailyFormatted,
  cardVariant = 'forest',
  className,
}: VirtualCardProps) {
  const isForest = cardVariant === 'forest';

  return (
    <div
      className={cn(
        'relative rounded-[22px] p-6 overflow-hidden select-none transition-all hover:scale-[1.01] duration-300',
        isForest
          ? 'bg-gradient-to-br from-[#073B2F] via-[#09483A] to-[#04241D] text-white shadow-[0_8px_24px_rgba(7,59,47,0.22)] border border-[#0D5947]'
          : 'bg-gradient-to-br from-[#B7F477] via-[#A4E763] to-[#80CF38] text-[#073B2F] shadow-[0_8px_24px_rgba(164,231,99,0.3)] border border-[#96E04E]',
        className
      )}
    >
      {/* Precision Wave Line-Art Pattern */}
      <div className="absolute inset-0 opacity-[0.16] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="guilloche-waves" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M0 24 Q12 0 24 24 T48 24" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#guilloche-waves)" />
        </svg>
      </div>

      {/* Top Card Row */}
      <div className="relative flex items-center justify-between mb-4">
        <div>
          <span
            className={cn(
              'text-[9px] uppercase font-bold tracking-widest',
              isForest ? 'text-[#A4E763]' : 'text-[#073B2F]/80'
            )}
          >
            30-Day Simulation Pass
          </span>
          <div className="text-xs font-extrabold tracking-tight mt-0.5">
            PaisaPilot Debit
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Contactless waves */}
          <Wifi
            className={cn('w-4 h-4 rotate-90', isForest ? 'text-white/80' : 'text-[#073B2F]/80')}
            aria-label="Contactless payment"
          />
          {/* Mastercard-style Interlocking Circles */}
          <div className="flex -space-x-2">
            <div
              className={cn(
                'w-5 h-5 rounded-full backdrop-blur-sm border',
                isForest ? 'bg-[#A4E763]/30 border-[#A4E763]/50' : 'bg-[#073B2F]/20 border-[#073B2F]/30'
              )}
            />
            <div
              className={cn(
                'w-5 h-5 rounded-full backdrop-blur-sm border',
                isForest ? 'bg-white/30 border-white/50' : 'bg-[#073B2F]/30 border-[#073B2F]/40'
              )}
            />
          </div>
        </div>
      </div>

      {/* Main Available Balance */}
      <div className="relative my-3">
        <div
          className={cn(
            'text-[11px] font-medium tracking-wide uppercase',
            isForest ? 'text-white/70' : 'text-[#073B2F]/75'
          )}
        >
          Available Cash Balance
        </div>
        <div
          className={cn(
            'text-3xl font-extrabold font-mono tracking-tight mt-0.5',
            isForest ? 'text-white' : 'text-[#073B2F]'
          )}
        >
          {balanceFormatted}
        </div>
      </div>

      {/* Bottom Card Row */}
      <div
        className={cn(
          'relative flex items-end justify-between mt-5 pt-3 border-t',
          isForest ? 'border-white/15' : 'border-[#073B2F]/15'
        )}
      >
        <div>
          <div className="text-[11px] font-mono font-bold tracking-widest">
            •••• 6721
          </div>
          <div
            className={cn(
              'text-[10px] font-medium tracking-wide uppercase mt-0.5',
              isForest ? 'text-white/70' : 'text-[#073B2F]/75'
            )}
          >
            {userName} • Day {currentDay}/{totalDays}
          </div>
        </div>

        <div className="text-right">
          <div
            className={cn(
              'text-[9px] font-semibold tracking-wider uppercase',
              isForest ? 'text-white/70' : 'text-[#073B2F]/75'
            )}
          >
            Safe Daily Limit
          </div>
          <div
            className={cn(
              'text-xs font-mono font-bold',
              isForest ? 'text-[#B7F477]' : 'text-[#073B2F]'
            )}
          >
            {safeDailyFormatted}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Risk Badge ──────────────────────────────────────────────────────────── */
interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = {
    low: {
      label: 'Low Risk',
      bg: 'bg-[#EAF7E8] border-[#C3E7BF]',
      text: 'text-[#27834A]',
      dot: 'bg-[#27834A]',
      icon: ShieldCheck,
    },
    medium: {
      label: 'Moderate Risk',
      bg: 'bg-[#FFF4D9] border-[#FFE0A3]',
      text: 'text-[#C28A24]',
      dot: 'bg-[#C28A24]',
      icon: ShieldAlert,
    },
    high: {
      label: 'Elevated Risk',
      bg: 'bg-[#FFF0E6] border-[#FFD2B8]',
      text: 'text-[#D96A24]',
      dot: 'bg-[#D96A24]',
      icon: ShieldAlert,
    },
    critical: {
      label: 'Critical Shortfall',
      bg: 'bg-[#FDECEC] border-[#F7C4C4]',
      text: 'text-[#D94B4B]',
      dot: 'bg-[#D94B4B]',
      icon: ShieldAlert,
    },
  };
  const { label, bg, text, dot, icon: Icon } = config[level];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border tracking-wide font-mono shadow-xs',
        bg,
        text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

/* ─── Progress Ring ───────────────────────────────────────────────────────── */
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = '#27834A',
  trackColor = '#E8E8E6',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Page Header ─────────────────────────────────────────────────────────── */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14251F] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-[#7B827E] mt-1 font-medium">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
