import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'violet' | 'emerald' | 'none';
  hoverable?: boolean;
}

const colorMap = {
  cyan: 'hover:shadow-[0_0_15px_-3px_rgba(34,211,238,0.4)] hover:border-cyan-500/50',
  violet: 'hover:shadow-[0_0_15px_-3px_rgba(139,92,246,0.4)] hover:border-violet-500/50',
  emerald: 'hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] hover:border-emerald-500/50',
  none: '',
};

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  glowColor = 'cyan', 
  hoverable = false,
  ...props 
}) => {
  return (
    <motion.div
      className={cn(
        "bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl rounded-xl transition-colors duration-300",
        hoverable ? colorMap[glowColor] : "",
        className
      )}
      whileHover={hoverable ? { scale: 1.01, y: -2 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};
