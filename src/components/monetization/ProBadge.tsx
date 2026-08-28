'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Size of the badge */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Visual style variant */
  variant?: 'gradient' | 'subtle' | 'outline' | 'icon-only';
  /** Whether to render the badge text alongside the crown icon */
  showText?: boolean;
  /** Custom badge text (defaults to "PRO") */
  text?: string;
  /** Optional custom class names */
  className?: string;
}

const sizeConfig = {
  xs: {
    badge: 'px-1.5 py-0.5 text-[10px] gap-1',
    icon: 'h-3 w-3',
  },
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1.5',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    badge: 'px-2.5 py-1 text-xs gap-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'px-3.5 py-1.5 text-sm gap-2',
    icon: 'h-5 w-5',
  },
};

export function ProBadge({
  size = 'sm',
  variant = 'gradient',
  showText = true,
  text = 'PRO',
  className,
  ...props
}: ProBadgeProps) {
  const currentSize = sizeConfig[size] || sizeConfig.sm;

  if (variant === 'icon-only') {
    return (
      <span
        title="PlateUp Pro Member"
        aria-label="PlateUp Pro Member"
        className={cn('inline-flex items-center justify-center shrink-0', className)}
        {...props}
      >
        <Crown
          className={cn(
            'text-amber-500 fill-amber-500 transition-transform duration-200 hover:scale-110 drop-shadow-xs',
            currentSize.icon
          )}
        />
      </span>
    );
  }

  const variantStyles = {
    gradient:
      'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white font-bold shadow-xs border border-amber-300/40 hover:brightness-105',
    subtle:
      'bg-amber-100/90 text-amber-900 font-bold border border-amber-300/80 shadow-2xs hover:bg-amber-100',
    outline:
      'border border-amber-500 text-amber-800 bg-amber-50/70 font-bold shadow-2xs hover:bg-amber-100/50',
  };

  return (
    <span
      title="PlateUp Pro Member"
      aria-label={`PlateUp ${text}`}
      className={cn(
        'inline-flex items-center rounded-full tracking-wide uppercase transition-all duration-200 select-none shrink-0',
        variantStyles[variant] || variantStyles.gradient,
        currentSize.badge,
        className
      )}
      {...props}
    >
      <Crown
        className={cn(
          'text-amber-200 fill-amber-300 shrink-0',
          variant === 'subtle' && 'text-amber-600 fill-amber-500',
          variant === 'outline' && 'text-amber-600 fill-amber-500',
          currentSize.icon
        )}
      />
      {showText && <span className="leading-none">{text}</span>}
    </span>
  );
}

export default ProBadge;
