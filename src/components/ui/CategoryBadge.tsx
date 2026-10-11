'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { TransactionCategory } from '@/types/finance';
import {
  UtensilsCrossed,
  Car,
  Film,
  ShoppingBag,
  Zap,
  Building2,
  HeartPulse,
  GraduationCap,
  PiggyBank,
  ArrowDownLeft,
  Tv,
  AlertOctagon,
  Layers,
  LucideIcon,
} from 'lucide-react';

export interface CategoryMeta {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
}

export const CATEGORY_CONFIG: Record<TransactionCategory, CategoryMeta> = {
  food: {
    label: 'Food & Dining',
    color: '#073B2F',
    bgColor: '#F1F9E9',
    borderColor: '#E5E8E3',
    icon: UtensilsCrossed,
  },
  transport: {
    label: 'Transport',
    color: '#14251F',
    bgColor: '#F4F5F3',
    borderColor: '#E5E8E3',
    icon: Car,
  },
  entertainment: {
    label: 'Entertainment',
    color: '#073B2F',
    bgColor: '#E8F7DB',
    borderColor: '#CBE5B8',
    icon: Film,
  },
  shopping: {
    label: 'Shopping',
    color: '#14251F',
    bgColor: '#F4F5F3',
    borderColor: '#E5E8E3',
    icon: ShoppingBag,
  },
  utilities: {
    label: 'Utilities',
    color: '#C28A24',
    bgColor: '#FFF4D9',
    borderColor: '#FFE0A3',
    icon: Zap,
  },
  rent: {
    label: 'Housing & Rent',
    color: '#D94B4B',
    bgColor: '#FDECEC',
    borderColor: '#F7C4C4',
    icon: Building2,
  },
  health: {
    label: 'Healthcare',
    color: '#27834A',
    bgColor: '#EAF7E8',
    borderColor: '#C3E7BF',
    icon: HeartPulse,
  },
  education: {
    label: 'Education',
    color: '#14251F',
    bgColor: '#F4F5F3',
    borderColor: '#E5E8E3',
    icon: GraduationCap,
  },
  savings: {
    label: 'Savings Vault',
    color: '#073B2F',
    bgColor: '#B7F477',
    borderColor: '#A4E763',
    icon: PiggyBank,
  },
  income: {
    label: 'Income & Inflow',
    color: '#27834A',
    bgColor: '#EAF7E8',
    borderColor: '#C3E7BF',
    icon: ArrowDownLeft,
  },
  subscription: {
    label: 'Subscriptions',
    color: '#073B2F',
    bgColor: '#F1F9E9',
    borderColor: '#E5E8E3',
    icon: Tv,
  },
  emergency: {
    label: 'Emergency',
    color: '#D94B4B',
    bgColor: '#FDECEC',
    borderColor: '#F7C4C4',
    icon: AlertOctagon,
  },
  other: {
    label: 'Miscellaneous',
    color: '#7B827E',
    bgColor: '#F4F5F3',
    borderColor: '#E5E8E3',
    icon: Layers,
  },
};

export function getCategoryConfig(category: TransactionCategory): CategoryMeta {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
}

interface CategoryBadgeProps {
  category: TransactionCategory;
  className?: string;
  showIcon?: boolean;
}

export function CategoryBadge({ category, className, showIcon = true }: CategoryBadgeProps) {
  const { label, color, bgColor, borderColor, icon: Icon } = getCategoryConfig(category);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors',
        className
      )}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: color,
      }}
    >
      {showIcon && <Icon className="w-3 h-3" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

interface CategoryIconProps {
  category: TransactionCategory;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryIcon({ category, size = 'md', className }: CategoryIconProps) {
  const { color, bgColor, borderColor, icon: Icon } = getCategoryConfig(category);

  const containerSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0 border shadow-xs',
        containerSizes[size],
        className
      )}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: color,
      }}
      aria-label={category}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
    </div>
  );
}
