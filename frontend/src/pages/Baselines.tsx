import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Play, RotateCcw, AlertTriangle, X, ShieldCheck, Server, CheckCircle2, Eye, Clock, FileCode } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowButton } from '../components/ui/GlowButton';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { useAuth, useAppState, DriftAlert } from '../lib/AuthContext';

export default function Baselines() {
  const { user } = useAuth();
  const { changeRequests, addChangeRequest, driftAlerts, addAuditEntry, rollbackConfig, pcaScans, addPcaScan, resolveDriftAlert, updateConfigItem } = useAppState();

  const [scanningId, setScanningId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<{ alertId: string; name: string; version: string } | null>(null);
  const [diffTarget, setDiffTarget] = useState<DriftAlert | null>(null);

  // Baselines = Approved or Deployed CRs — these represent known-good snapshots
  const baselines = changeRequests.filter(cr => cr.status === 'approved' || cr.status === 'deployed' || cr.status === 'baselined');
  const activeDriftAlerts = driftAlerts.filter(a => a.status === 'active');

  const handleResolve = (alert: DriftAlert) => {
    resolveDriftAlert(alert.id);
    updateConfigItem(alert.configId, {
      hash: alert.actualHash,
      liveHash: alert.actualHash,
      content: alert.driftedContent
    });
    
    const matchingBaseline = baselines.find(b => b.configName === alert.configName);
    
    addChangeRequest({
      id: `CR-${Date.now()}`,
      configId: alert.configId,
      configName: alert.configName,
      version: matchingBaseline ? `${matchingBaseline.version}-hotfix` : 'hotfix',
      environment: alert.environment as any,
      owner: matchingBaseline?.owner || 'Ops Team',
      submittedBy: user?.name || 'System',
      submittedAt: 'just now',
      status: 'baselined',
      severity: alert.severity,
      commitMessage: 'Drift resolved and accepted as new valid baseline',
      fileContent: alert.driftedContent,
      previousContent: alert.baselineContent,
      approvedBy: user?.name || 'Admin',
      approvedAt: 'just now',
      deployedAt: 'just now',
    });

    addAuditEntry({
      id: `AU-${Date.now()}`,
      crId: alert.id,
      action: 'DRIFT_RESOLVED',
      performedBy: user?.name || 'Admin',
      role: 'Admin',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      details: `Drift on ${alert.configName} accepted as valid. Approved baseline updated to match live server hash ${alert.actualHash}.`,
    });
    setScanResult(`✓ Drift resolved. ${alert.configName} baseline updated to match live configuration.`);
    setDiffTarget(null);
  };

  const handleScan = (crId: string, configName: string) => {
    setScanningId(crId);
    setScanResult(null);
    setTimeout(() => {
      setScanningId(null);
      const hasDrift = activeDriftAlerts.some(a => a.configName === configName);
      const resultMsg = hasDrift
        ? `⚠ PCA FAILURE on ${configName}: Live hash does not match approved baseline. Rollback recommended.`
        : `✓ PCA PASSED for ${configName}: Live file hash matches approved baseline.`;
      setScanResult(resultMsg);
      // Add to PCA scan history
      const matchingAlert = activeDriftAlerts.find(a => a.configName === configName);
      addPcaScan({
        id: `PCA-${Date.now()}`,
        configName,
        environment: matchingAlert?.environment || 'production',
        scannedAt: 'just now',
        result: hasDrift ? 'fail' : 'pass',
        expectedHash: matchingAlert?.expectedHash || 'sha256:matched',
        actualHash: matchingAlert?.actualHash || matchingAlert?.expectedHash || 'sha256:matched',
        driftAlertId: matchingAlert?.id,
      });
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
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-1">
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
                <div className="flex gap-2">
                  {alert.baselineContent && alert.driftedContent && (
                    <GlowButton size="sm" variant="secondary" onClick={() => setDiffTarget(alert)}>
                      <Eye size={13} className="mr-1.5" /> View Diff
                    </GlowButton>
                  )}
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
                  <GlowButton size="sm" variant="secondary" className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleResolve(alert)}>
                    <CheckCircle2 size={13} className="mr-1.5" /> Resolve
                  </GlowButton>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Baselines Table — scrollable */}
      <GlassCard>
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-white">Approved Baselines — Known-Good Snapshots</h3>
        </div>
        <div className="overflow-auto max-h-[280px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-[#16181d] border-b border-white/5 sticky top-0 z-10 shadow-sm">
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* PCA Scan History */}
      <GlassCard>
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Clock size={16} className="text-violet-400" />
          <h3 className="text-sm font-medium text-white">PCA Scan History</h3>
          <span className="text-xs text-gray-500 ml-auto">{pcaScans.length} scans</span>
        </div>
        <div className="overflow-auto max-h-[250px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-[#16181d] border-b border-white/5 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-3">Scan ID</th>
                <th className="px-5 py-3">Config File</th>
                <th className="px-5 py-3">Environment</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3">Expected Hash</th>
                <th className="px-5 py-3">Actual Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pcaScans.map(scan => (
                <tr key={scan.id} className={`hover:bg-white/5 transition-colors ${scan.result === 'fail' ? 'bg-red-500/[0.03]' : ''}`}>
                  <td className="px-5 py-3 font-mono text-xs text-gray-400">{scan.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-400">
                      <FileCode size={13} /> {scan.configName}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 capitalize">{scan.environment}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{scan.scannedAt}</td>
                  <td className="px-5 py-3">
                    <Badge variant={scan.result === 'pass' ? 'success' : 'critical'}>
                      {scan.result === 'pass' ? '✓ PASS' : '✗ FAIL'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-[10px] text-emerald-400">{scan.expectedHash}</td>
                  <td className={`px-5 py-3 font-mono text-[10px] ${scan.result === 'fail' ? 'text-red-400' : 'text-emerald-400'}`}>{scan.actualHash}</td>
                </tr>
              ))}
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

      {/* Drift Diff Viewer Modal */}
      <AnimatePresence>
        {diffTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setDiffTarget(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-4xl max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <GlassCard className="flex flex-col overflow-hidden border-red-500/30">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-500" />
                    <h2 className="text-sm font-bold text-white">
                      Drift Detected: <span className="font-mono text-cyan-400">{diffTarget.configName}</span>
                    </h2>
                    <Badge variant={diffTarget.severity as BadgeVariant}>{diffTarget.severity}</Badge>
                  </div>
                  <button className="text-gray-400 hover:text-white" onClick={() => setDiffTarget(null)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 divide-x divide-white/10 overflow-auto flex-1">
                  {/* Baseline (approved) */}
                  <div className="flex flex-col">
                    <div className="px-4 py-2 bg-emerald-500/10 border-b border-white/5 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-300">Approved Baseline</span>
                      <span className="text-[10px] font-mono text-gray-500 ml-auto">{diffTarget.expectedHash}</span>
                    </div>
                    <pre className="p-4 text-xs text-emerald-300/80 font-mono whitespace-pre-wrap leading-relaxed overflow-auto flex-1">
                      {diffTarget.baselineContent}
                    </pre>
                  </div>
                  {/* Drifted (live) */}
                  <div className="flex flex-col">
                    <div className="px-4 py-2 bg-red-500/10 border-b border-white/5 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-xs font-semibold text-red-300">Live Server (Drifted)</span>
                      <span className="text-[10px] font-mono text-gray-500 ml-auto">{diffTarget.actualHash}</span>
                    </div>
                    <pre className="p-4 text-xs text-red-300/80 font-mono whitespace-pre-wrap leading-relaxed overflow-auto flex-1">
                      {diffTarget.driftedContent}
                    </pre>
                  </div>
                </div>
                <div className="p-3 border-t border-white/5 flex justify-end gap-2">
                  <GlowButton size="sm" variant="ghost" onClick={() => setDiffTarget(null)}>Close</GlowButton>
                  <GlowButton size="sm" variant="danger" onClick={() => {
                    setDiffTarget(null);
                    const matchingBaseline = baselines.find(b => b.configName === diffTarget.configName);
                    setRollbackTarget({
                      alertId: diffTarget.id,
                      name: diffTarget.configName,
                      version: matchingBaseline?.version || 'last-approved',
                    });
                  }}>
                    <RotateCcw size={13} className="mr-1.5" /> Rollback to Baseline
                  </GlowButton>
                  <GlowButton size="sm" variant="secondary" className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleResolve(diffTarget)}>
                    <CheckCircle2 size={13} className="mr-1.5" /> Resolve (Accept Drift)
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
