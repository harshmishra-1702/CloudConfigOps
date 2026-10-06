import React, { useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  title: string;
  value: number | string;
  change: string;
  icon: LucideIcon;
  color?: 'cyan' | 'violet' | 'emerald' | 'orange' | 'red';
}

const colorClasses = {
  cyan: 'bg-cyan-500/20 text-cyan-400',
  violet: 'bg-violet-500/20 text-violet-400',
  emerald: 'bg-emerald-500/20 text-emerald-400',
  orange: 'bg-orange-500/20 text-orange-400',
  red: 'bg-red-500/20 text-red-400',
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color = 'cyan' }) => {
  const isPositive = change.startsWith('+') || (!change.startsWith('-') && change !== '0%');
  const isNegative = change.startsWith('-');
  
  const count = useMotionValue(0);
  const isNumber = typeof value === 'number';
  const rounded = useTransform(count, (latest) => Math.round(latest));
  
  useEffect(() => {
    if (isNumber) {
      const controls = animate(count, value as number, { duration: 1.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [value, isNumber, count]);

  return (
    <GlassCard hoverable glowColor="cyan" className="p-6 flex items-start justify-between">
      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
        <div className="flex items-baseline gap-3">
          <motion.span className="text-3xl font-bold text-white">
            {isNumber ? <motion.span>{rounded}</motion.span> : value}
          </motion.span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
            isPositive ? 'bg-emerald-500/20 text-emerald-400' : isNegative ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {change}
          </span>
        </div>
      </div>
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
    </GlassCard>
  );
};
