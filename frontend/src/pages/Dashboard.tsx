import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, AlertTriangle, ShieldAlert, Clock, ChevronRight, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { GlowButton } from '../components/ui/GlowButton';
import { useAuth, useAppState } from '../lib/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const riskData = [
  { name: 'Critical', value: 4, color: '#ef4444' },
  { name: 'High',     value: 8, color: '#f97316' },
  { name: 'Medium',   value: 15, color: '#eab308' },
  { name: 'Low',      value: 20, color: '#3b82f6' },
];

const timelineData = [
  { name: 'Mon', detections: 12, remediations: 10 },
  { name: 'Tue', detections: 15, remediations: 14 },
  { name: 'Wed', detections: 8,  remediations: 12 },
  { name: 'Thu', detections: 25, remediations: 20 },
  { name: 'Fri', detections: 10, remediations: 15 },
  { name: 'Sat', detections: 5,  remediations: 8  },
  { name: 'Sun', detections: 7,  remediations: 7  },
];

const envStatus = [
  { env: 'Development', resources: 12, health: 'healthy', compliance: 100 },
  { env: 'Testing',     resources: 18, health: 'warning',  compliance: 91 },
  { env: 'Production',  resources: 47, health: 'critical', compliance: 78 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { driftAlerts, changeRequests, auditLog, configItems, resolveDriftAlert } = useAppState();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  if (loading) return <LoadingSpinner />;

  const activeDriftAlerts = driftAlerts.filter(a => a.status === 'active');
  const pendingCRs = changeRequests.filter(cr => cr.status === 'pending' || cr.status === 'reviewing');
  const totalResources = configItems.length;
  const complianceScore = Math.round((configItems.filter(ci => ci.status === 'baselined' || ci.status === 'approved').length / totalResources) * 100);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-gray-400 mt-1 text-sm">Real-time health of all environments, drift detection, and infrastructure oversight.</p>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Config Items" value={totalResources} change="+2" icon={Server} color="cyan" />
        <StatCard title="Active PCA Alerts" value={activeDriftAlerts.length} change={activeDriftAlerts.length > 0 ? '⚠ Action needed' : '✓ Clean'} icon={AlertTriangle} color="red" />
        <StatCard title="Compliance Score" value={`${complianceScore}%`} change="" icon={ShieldAlert} color="emerald" />
        <StatCard title="Pending Reviews" value={pendingCRs.length} change="" icon={Clock} color="violet" />
      </div>

      {/* ─── Environment Status ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {envStatus.map(({ env, resources, health, compliance }) => (
          <GlassCard key={env} className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-white text-sm">{env}</span>
              <Badge variant={health === 'healthy' ? 'success' : health === 'warning' ? 'medium' : 'critical'}>
                {health}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${compliance >= 95 ? 'bg-emerald-500' : compliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${compliance}%` }} />
              </div>
              <span className="text-xs text-gray-400">{compliance}%</span>
            </div>
            <p className="text-xs text-gray-500">{resources} resources monitored</p>
          </GlassCard>
        ))}
      </div>

      {/* ─── Main panels ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <GlassCard className="p-5">
              <h3 className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Risk Distribution</h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-[11px] mt-1">
                {riskData.map(d => <div key={d.name} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-gray-400">{d.name}</span></div>)}
              </div>
            </GlassCard>
            <GlassCard className="p-5">
              <h3 className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Drift vs. Remediations</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="cD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      <linearGradient id="cR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="detections" stroke="#ef4444" fill="url(#cD)" />
                    <Area type="monotone" dataKey="remediations" stroke="#10b981" fill="url(#cR)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* Audit Log */}
          <GlassCard className="overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-medium text-white text-sm flex items-center gap-2">
                <Activity size={16} className="text-violet-400" /> Configuration Status & Change History Report
              </h3>
              <button className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 transition-colors"
                onClick={() => navigate('/baselines')}>
                View Baselines <ChevronRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-gray-500 uppercase bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">CR / Action</th>
                    <th className="px-4 py-3">Performed By</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLog.map(entry => (
                    <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{entry.timestamp}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${entry.action === 'APPROVED' ? 'text-emerald-400' : entry.action === 'REJECTED' ? 'text-red-400' : entry.action === 'DEPLOYED' ? 'text-cyan-400' : 'text-gray-300'}`}>
                            {entry.action}
                          </span>
                          <span className="font-mono text-gray-500">{entry.crId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-300">{entry.performedBy}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={entry.role === 'Admin' ? 'critical' : entry.role === 'Reviewer' ? 'pending' : 'deployed'}>
                          {entry.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 max-w-[240px]">{entry.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* ─── PCA Drift Alerts Widget ─── */}
        <div className="relative rounded-2xl">
          {activeDriftAlerts.length > 0 && (
            <div className="absolute inset-0 rounded-2xl animate-pulse bg-red-500/10 blur-sm -z-10" />
          )}
          <GlassCard className={`h-full flex flex-col ${activeDriftAlerts.length > 0 ? 'border-red-500/30' : 'border-white/[0.08]'}`}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-medium text-white text-sm flex items-center gap-2">
                <AlertTriangle size={16} className={activeDriftAlerts.length > 0 ? 'text-red-500' : 'text-gray-500'} />
                PCA Drift Alerts
              </h3>
              {activeDriftAlerts.length > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {activeDriftAlerts.length} LIVE
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {activeDriftAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-2">
                  <CheckCircle2 size={28} className="opacity-30" />
                  <p className="text-xs">All hashes match. No drift detected.</p>
                </div>
              ) : activeDriftAlerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{alert.configName}</p>
                      <p className="text-[11px] text-gray-400">{alert.environment} • {alert.detectedAt}</p>
                    </div>
                    <Badge variant={alert.severity as BadgeVariant}>{alert.severity}</Badge>
                  </div>
                  <div className="bg-black/30 rounded p-2 mb-2 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5"><CheckCircle2 size={11}/> Expected: {alert.expectedHash}</div>
                    <div className="flex items-center gap-1.5 text-red-400"><XCircle size={11}/> Actual: &nbsp;&nbsp;&nbsp;{alert.actualHash}</div>
                  </div>
                  <div className="flex gap-2">
                    <GlowButton size="sm" variant="danger" className="flex-1 text-[11px]" onClick={() => navigate('/baselines')}>
                      Rollback
                    </GlowButton>
                    <GlowButton size="sm" variant="ghost" className="text-[11px]" onClick={() => resolveDriftAlert(alert.id)}>
                      Resolve
                    </GlowButton>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
