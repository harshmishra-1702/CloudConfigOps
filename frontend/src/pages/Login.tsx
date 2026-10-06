import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Code, CheckSquare, Server } from 'lucide-react';
import { useAuth, Role } from '../lib/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowButton } from '../components/ui/GlowButton';

const roles: { role: Role; icon: React.ReactNode; title: string; subtitle: string; color: string; border: string }[] = [
  {
    role: 'developer',
    icon: <Code size={22} />,
    title: 'Login as Developer',
    subtitle: 'Author configs · Submit Change Requests · Track status',
    color: 'text-cyan-400',
    border: 'hover:border-cyan-500/50',
  },
  {
    role: 'reviewer',
    icon: <CheckSquare size={22} />,
    title: 'Login as Reviewer',
    subtitle: 'Audit diffs · Run FCA · Approve or reject CRs',
    color: 'text-violet-400',
    border: 'hover:border-violet-500/50',
  },
  {
    role: 'admin',
    icon: <Server size={22} />,
    title: 'Login as Ops / Admin',
    subtitle: 'Monitor drift · Rollback · Manage users · Audit logs',
    color: 'text-emerald-400',
    border: 'hover:border-emerald-500/50',
  },
];

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState<Role | null>(null);

  const handleLogin = (role: Role) => {
    setLoading(role);
    setTimeout(() => login(role), 600);
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[50%] bg-violet-500/10 rounded-full blur-[120px]" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="z-10 w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-cyan-500/20 p-4 rounded-2xl text-cyan-400 mb-4 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <Shield size={44} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Cloud<span className="text-cyan-400">Config</span> Ops
          </h1>
          <p className="text-gray-400 mt-2 text-sm text-center">
            Secure Infrastructure Configuration Management
          </p>
        </div>

        <GlassCard className="p-6 flex flex-col gap-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-2">Select Demo Role</p>
          {roles.map(({ role, icon, title, subtitle, color, border }) => (
            <motion.button
              key={role}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleLogin(role)}
              disabled={loading !== null}
              className={`w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] transition-all duration-200 ${border} disabled:opacity-60`}
            >
              <div className={`p-2.5 rounded-lg bg-white/5 ${color}`}>{icon}</div>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-white">
                  {loading === role ? 'Signing in...' : title}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">{subtitle}</span>
              </div>
            </motion.button>
          ))}
        </GlassCard>

        <p className="text-center text-xs text-gray-600 mt-4">
          Strict separation of duties enforced by RBAC
        </p>
      </motion.div>
    </div>
  );
}
