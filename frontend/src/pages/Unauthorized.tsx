import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlowButton } from '../components/ui/GlowButton';
import { useAuth } from '../lib/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user?.role === 'admin') navigate('/command-center');
    else if (user?.role === 'reviewer') navigate('/approvals');
    else navigate('/repository');
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">403 Unauthorized</h1>
        <p className="text-gray-400 mb-8">
          Your current role (<span className="text-white capitalize">{user?.role}</span>) does not have permission to access this resource. 
          This action is restricted by CloudConfig Ops security policies.
        </p>
        <GlowButton variant="secondary" onClick={handleGoBack}>
          <ArrowLeft size={16} className="mr-2" /> Return to Dashboard
        </GlowButton>
      </motion.div>
    </div>
  );
}
