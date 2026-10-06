import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Play, RotateCcw, AlertTriangle, X, ShieldCheck, Server, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowButton } from '../components/ui/GlowButton';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { useAuth, useAppState } from '../lib/AuthContext';

export default function Baselines() {
  const { user } = useAuth();
  const { changeRequests, driftAlerts, addAuditEntry, rollbackConfig } = useAppState();

  const [scanningId, setScanningId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<{ alertId: string; name: string; version: string } | null>(null);

  // Baselines = Approved or Deployed CRs — these represent known-good snapshots
  const baselines = changeRequests.filter(cr => cr.status === 'approved' || cr.status === 'deployed' || cr.status === 'baselined');
  const activeDriftAlerts = driftAlerts.filter(a => a.status === 'active');

  const handleScan = (crId: string, configName: string) => {
    setScanningId(crId);
    setScanResult(null);
    setTimeout(() => {
      setScanningId(null);
      // Check if there is a matching active drift alert for this config
      const hasDrift = activeDriftAlerts.some(a => a.configName === configName);
      setScanResult(hasDrift
        ? `⚠ PCA FAILURE on ${configName}: Live hash does not match approved baseline. Rollback recommended.`
        : `✓ PCA PASSED for ${configName}: Live file hash matches approved baseline.`
      );
    }, 2000);
  };

  const handleRollbackConfirm = () => {
    if (!rollbackTarget || !user) return;
    rollbackConfig(rollbackTarget.alertId);
    addAuditEntry({
      id: `AU-${Date.now()}`,
      crId: rollbackTarget.alertId,
      action: 'ROLLBACK_EXECUTED',
      performedBy: user.name,
      role: 'Admin',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      details: `Emergency rollback of ${rollbackTarget.name} to v${rollbackTarget.version} executed by ${user.name}.`,
    });
    setScanResult(`✓ Rollback executed. ${rollbackTarget.name} reverted to baseline v${rollbackTarget.version}.`);
    setRollbackTarget(null);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Baselines & Rollback</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Approved snapshots serve as deployment baselines. Run PCA scans or execute one-click rollbacks if drift is detected.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg"><ShieldCheck size={18} className="text-emerald-400" /></div>
            <h3 className="text-sm font-semibold text-white">Approved Baselines</h3>
          </div>
          <p className="text-3xl font-bold text-white">{baselines.length}</p>
          <p className="text-xs text-gray-500 mt-1">Known-good configuration snapshots</p>
        </GlassCard>
        <GlassCard className={`p-5 ${activeDriftAlerts.length > 0 ? 'border-red-500/30 bg-red-500/5' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle size={18} className="text-red-400" /></div>
            <h3 className="text-sm font-semibold text-white">Active PCA Failures</h3>
          </div>
          <p className={`text-3xl font-bold ${activeDriftAlerts.length > 0 ? 'text-red-400' : 'text-white'}`}>{activeDriftAlerts.length}</p>
          <p className="text-xs text-gray-500 mt-1">Configs with live hash mismatch</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-500/20 rounded-lg"><History size={18} className="text-violet-400" /></div>
            <h3 className="text-sm font-semibold text-white">Total History</h3>
          </div>
          <p className="text-3xl font-bold text-white">{changeRequests.length}</p>
          <p className="text-xs text-gray-500 mt-1">Change requests across all environments</p>
        </GlassCard>
      </div>

      {/* Scan Result */}
      <AnimatePresence>
        {scanResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm border ${
              scanResult.startsWith('⚠') ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
            {scanResult.startsWith('⚠') ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span className="flex-1">{scanResult}</span>
            <button onClick={() => setScanResult(null)}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Drift Alerts requiring action */}
      {activeDriftAlerts.length > 0 && (
        <GlassCard className="border-red-500/30 bg-red-500/[0.03]">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="text-sm font-semibold text-red-300">PCA Failures — Immediate Action Required</h3>
          </div>
          <div className="p-4 space-y-3">
            {activeDriftAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{alert.configName}</span>
                    <Badge variant={alert.severity as BadgeVariant}>{alert.severity}</Badge>
                    <span className="text-xs text-gray-500">({alert.environment})</span>
                  </div>
                  <div className="text-[11px] font-mono">
                    <span className="text-emerald-400">Expected: {alert.expectedHash}</span>
                    <span className="text-gray-600 mx-2">|</span>
                    <span className="text-red-400">Actual: {alert.actualHash}</span>
                  </div>
                </div>
                <GlowButton size="sm" variant="danger"
                  onClick={() => {
                    const matchingBaseline = baselines.find(b => b.configName === alert.configName);
                    setRollbackTarget({
                      alertId: alert.id,
                      name: alert.configName,
                      version: matchingBaseline?.version || 'last-approved',
                    });
                  }}>
                  <RotateCcw size={13} className="mr-1.5" /> Rollback
                </GlowButton>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Baselines Table */}
      <GlassCard className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-white">Approved Baselines — Known-Good Snapshots</h3>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-5 py-3">CR ID</th>
                <th className="px-5 py-3">Config File</th>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Environment</th>
                <th className="px-5 py-3">Approved By</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {baselines.map(bl => {
                const hasDrift = activeDriftAlerts.some(a => a.configName === bl.configName);
                return (
                  <tr key={bl.id} className={`hover:bg-white/5 transition-colors ${hasDrift ? 'bg-red-500/[0.03]' : ''}`}>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{bl.id}</td>
                    <td className="px-5 py-3 font-mono text-xs text-cyan-400">
                      <div className="flex items-center gap-1.5">
                        {hasDrift && <AlertTriangle size={12} className="text-red-400" />}
                        {bl.configName}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-300 font-mono">v{bl.version}</td>
                    <td className="px-5 py-3 text-xs text-gray-400 capitalize">{bl.environment}</td>
                    <td className="px-5 py-3 text-xs text-gray-300">{bl.approvedBy || '—'}</td>
                    <td className="px-5 py-3">
                      <Badge variant={bl.status === 'deployed' ? 'deployed' : bl.status === 'approved' ? 'success' : 'deployed'}>
                        {bl.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <GlowButton size="sm" variant="secondary"
                          loading={scanningId === bl.id}
                          onClick={() => handleScan(bl.id, bl.configName)}>
                          <Play size={13} className="mr-1" /> PCA Scan
                        </GlowButton>
                        {hasDrift && (
                          <GlowButton size="sm" variant="danger"
                            onClick={() => {
                              const alert = activeDriftAlerts.find(a => a.configName === bl.configName);
                              if (alert) setRollbackTarget({ alertId: alert.id, name: bl.configName, version: bl.version });
                            }}>
                            <RotateCcw size={13} className="mr-1" /> Rollback
                          </GlowButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Rollback Confirmation Modal */}
      <AnimatePresence>
        {rollbackTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md">
              <GlassCard className="p-6 border-red-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Confirm Rollback</h2>
                    <p className="text-xs text-gray-400">This action is immediate and irreversible</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  You are about to initiate an emergency rollback of{' '}
                  <span className="font-mono text-white font-bold">{rollbackTarget.name}</span>{' '}
                  to baseline version{' '}
                  <span className="font-mono text-cyan-400">v{rollbackTarget.version}</span>.
                  This will override the live configuration on the target server immediately.
                </p>
                <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
                  <GlowButton variant="ghost" onClick={() => setRollbackTarget(null)}>Cancel</GlowButton>
                  <GlowButton variant="danger" onClick={handleRollbackConfirm}>
                    <RotateCcw size={14} className="mr-1.5" /> Execute Rollback
                  </GlowButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
