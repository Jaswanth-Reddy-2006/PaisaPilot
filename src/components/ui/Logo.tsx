'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
}

export function Logo({
  className,
  size = 'md',
  showSubtitle = true,
  variant = 'light',
}: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
  };

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {/* Circular Lime-Green Brand Mark with Leaf / Wallet / Flight Motif */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#A4E763]/60 transition-transform hover:scale-105',
          iconSizes[size]
        )}
        style={{
          background: 'radial-gradient(circle at 35% 35%, #B7F477 0%, #A4E763 60%, #8BD842 100%)',
        }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[58%] h-[58%] text-[#073B2F]"
        >
          {/* Stylized leaf + flight chevron intersecting in wallet geometry */}
          <path
            d="M19.5 4.5C14.5 4.5 7 8 5 14C8 14 11.5 13 14 10.5C16.5 8 18 5.5 19.5 4.5Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path
            d="M5 14C4.5 17 6.5 19.5 10 19.5C14 19.5 17 15.5 19.5 4.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="9.5" r="1.5" fill="#B7F477" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div
          className={cn(
            'tracking-tight flex items-center leading-tight',
            variant === 'dark' ? 'text-white' : 'text-[#14251F]',
            textSizes[size]
          )}
        >
          <span className="font-extrabold">Paisa</span>
          <span className="text-[#073B2F] font-bold ml-0.5">Pilot</span>
        </div>
        {showSubtitle && (
          <span
            className={cn(
              'text-[9px] font-semibold tracking-wider uppercase',
              variant === 'dark' ? 'text-slate-400' : 'text-[#7B827E]'
            )}
          >
            Finance Simulator
          </span>
        )}
      </div>
    </div>
  );
}
