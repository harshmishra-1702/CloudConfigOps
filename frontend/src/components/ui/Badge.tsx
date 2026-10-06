import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'pending' | 'deployed';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  pending: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
  deployed: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
};

export const Badge: React.FC<BadgeProps> = ({ variant, children, className }) => {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider", variantStyles[variant], className)}>
      {children}
    </span>
  );
};
