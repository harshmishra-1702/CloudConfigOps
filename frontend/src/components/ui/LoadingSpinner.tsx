import React from 'react';
import { motion } from 'framer-motion';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-full p-8">
      <motion.div 
        className="w-10 h-10 border-4 border-white/10 border-t-accent rounded-full shadow-[0_0_15px_-3px_rgba(34,211,238,0.4)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};
