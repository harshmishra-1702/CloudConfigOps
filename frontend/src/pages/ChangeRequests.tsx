import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, X, AlertCircle, GitCompare, Clock, User, MessageSquareX, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowButton } from '../components/ui/GlowButton';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { useAuth, useAppState, ChangeRequest } from '../lib/AuthContext';

const statusBadge: Record<string, BadgeVariant> = {
  draft: 'low', pending: 'pending', reviewing: 'medium',
  approved: 'success', rejected: 'critical', deployed: 'deployed',
};

// Compute diff lines between two file contents
function computeDiff(oldContent: string, newContent: string) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const result: { type: 'same' | 'removed' | 'added'; old?: string; new?: string; lineNo: number }[] = [];
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === n) result.push({ type: 'same', old: o, new: n, lineNo: i + 1 });
    else result.push({ type: o !== undefined && n !== undefined ? 'removed' : o !== undefined ? 'removed' : 'added', old: o, new: n, lineNo: i + 1 });
  }
  return result;
}

export default function ChangeRequests() {
  const { user } = useAuth();
  const { changeRequests, updateChangeRequest, addAuditEntry, updateConfigItem } = useAppState();

  const [selected, setSelected] = useState<ChangeRequest | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [tab, setTab] = useState<'queue' | 'all'>('queue');

  const pendingCRs = changeRequests.filter(cr => cr.status === 'pending' || cr.status === 'reviewing');
  const allCRs = changeRequests;

  const handleApprove = () => {
    if (!selected || !user) return;
    // Enforce separation of duties: reviewer cannot approve their own submission
    if (selected.submittedBy === user.name) {
      alert('You cannot approve your own Change Request. Separation of duties enforced.');
      return;
    }
    updateChangeRequest(selected.id, {
      status: 'approved',
      approvedBy: user.name,
      approvedAt: 'just now',
    });
    // Also update the ConfigItem so the Developer's Repository page reflects the new status and content
    updateConfigItem(selected.configId, {
      status: 'approved',
      version: selected.version,
      lastModified: 'just now',
      content: selected.fileContent || undefined,
    });
    addAuditEntry({
      id: `AU-${Date.now()}`,
      crId: selected.id,
      action: 'APPROVED',
      performedBy: user.name,
      role: 'Reviewer',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      details: `FCA passed. ${selected.configName} v${selected.version} approved for baseline.`,
    });
    setSelected(null);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !user) return;
    updateChangeRequest(selected.id, {
      status: 'rejected',
      reviewerFeedback: `REJECTED by ${user.name}: ${rejectReason}`,
    });
    addAuditEntry({
      id: `AU-${Date.now()}`,
      crId: selected.id,
      action: 'REJECTED',
      performedBy: user.name,
      role: 'Reviewer',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      details: `FCA failed. Reason: ${rejectReason}`,
    });
    setRejectOpen(false);
    setRejectReason('');
    setSelected(null);
  };

  // ─── Diff Viewer Mode ─────────────────────────────────────────────────────
  if (selected) {
    const diff = selected.previousContent && selected.fileContent
      ? computeDiff(selected.previousContent, selected.fileContent)
      : null;

    return (
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white bg-white/5 p-1.5 rounded-md transition-colors">
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{selected.id}</h1>
                <Badge variant={statusBadge[selected.status]}>{selected.status}</Badge>
                <Badge variant={selected.severity as BadgeVariant}>{selected.severity}</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{selected.commitMessage}</p>
            </div>
          </div>

          {/* FCA Action Buttons — only for pending/reviewing */}
          {(selected.status === 'pending' || selected.status === 'reviewing') && (
            <div className="flex gap-3">
              <GlowButton variant="danger" onClick={() => setRejectOpen(true)}>
                <X size={15} className="mr-1.5" /> Reject
              </GlowButton>
              <GlowButton onClick={handleApprove} className="bg-gradient-to-r from-emerald-500 to-emerald-400 border-none shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]">
                <Check size={15} className="mr-1.5" /> Approve (Sign Off)
              </GlowButton>
            </div>
          )}
        </div>

        {/* CR Metadata */}
        <GlassCard className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div><p className="text-gray-500 mb-1">Config File</p><p className="text-cyan-400 font-mono">{selected.configName}</p></div>
          <div><p className="text-gray-500 mb-1">Version</p><p className="text-white">v{selected.version}</p></div>
          <div><p className="text-gray-500 mb-1">Environment</p><p className="text-white capitalize">{selected.environment}</p></div>
          <div><p className="text-gray-500 mb-1">Owner</p><p className="text-white">{selected.owner}</p></div>
          <div><p className="text-gray-500 mb-1">Submitted By</p><p className="text-white">{selected.submittedBy}</p></div>
          <div><p className="text-gray-500 mb-1">Submitted At</p><p className="text-white">{selected.submittedAt}</p></div>
          {selected.approvedBy && <div><p className="text-gray-500 mb-1">Approved By</p><p className="text-emerald-400">{selected.approvedBy}</p></div>}
        </GlassCard>

        {/* FCA Checklist */}
        {(selected.status === 'pending' || selected.status === 'reviewing') && (
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Functional Configuration Audit (FCA) Checklist</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {[
                'Verify change matches the stated commit message',
                'Confirm syntax is valid for the file type (YAML / JSON / .env)',
                'Ensure no unrelated or bundled unauthorized changes are included',
                'Check config was tested in Development or Test environment first',
                'Confirm owner metadata (Config ID, Name, Version, Environment) is complete',
                'Verify the submitter has not signed off on their own change (SOD)',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-300">
                  <div className="w-4 h-4 rounded border border-white/20 bg-white/5 shrink-0 mt-0.5 flex items-center justify-center">
                    <span className="text-[10px] text-gray-600">{i + 1}</span>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Diff Viewer */}
        <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-white/5 bg-black/10">
            <GitCompare size={16} className="text-violet-400" />
            <span className="text-sm font-medium text-white">Diff View</span>
            <span className="text-xs text-gray-500 ml-2">{selected.configName} — Baseline vs. Proposed</span>
          </div>
          <div className="flex border-b border-white/5 text-xs text-gray-500 bg-black/10">
            <div className="flex-1 px-4 py-2 border-r border-white/5">
              <span className="text-red-400 font-mono">— Baseline (v{selected.version.split('.').map((v, i) => i === 2 ? Math.max(0, parseInt(v) - 1) : v).join('.')})</span>
            </div>
            <div className="flex-1 px-4 py-2">
              <span className="text-emerald-400 font-mono">+ Proposed (v{selected.version})</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-[#0a0a10] font-mono text-xs">
            {diff ? diff.map((line, i) => (
              <div key={i} className="flex">
                {/* Old side */}
                <div className={`flex-1 border-r border-white/5 px-3 py-0.5 whitespace-pre-wrap ${
                  line.type === 'removed' ? 'bg-red-500/15 text-red-300' :
                  line.old === undefined ? 'bg-transparent text-transparent' : 'text-gray-400'
                }`}>
                  <span className="text-gray-600 select-none mr-3">{line.old !== undefined ? line.lineNo : ' '}</span>
                  {line.type === 'removed' && <span className="text-red-400 mr-1">-</span>}
                  {line.old ?? ''}
                </div>
                {/* New side */}
                <div className={`flex-1 px-3 py-0.5 whitespace-pre-wrap ${
                  line.new !== undefined && line.old !== line.new ? 'bg-emerald-500/15 text-emerald-300' :
                  line.new === undefined ? 'bg-transparent text-transparent' : 'text-gray-400'
                }`}>
                  <span className="text-gray-600 select-none mr-3">{line.new !== undefined ? line.lineNo : ' '}</span>
                  {line.new !== undefined && line.old !== line.new && <span className="text-emerald-400 mr-1">+</span>}
                  {line.new ?? ''}
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500">No diff data available for this request.</div>
            )}
          </div>
        </GlassCard>

        {/* Rejected feedback display */}
        {selected.reviewerFeedback && (
          <GlassCard className="p-4 border border-red-500/20 bg-red-500/5">
            <p className="text-xs font-bold text-red-400 mb-1">Reviewer Feedback</p>
            <p className="text-sm text-red-300">{selected.reviewerFeedback}</p>
          </GlassCard>
        )}

        {/* Reject Modal */}
        <AnimatePresence>
          {rejectOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md">
                <GlassCard className="p-6 border-red-500/30">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <MessageSquareX size={18} className="text-red-400" /> Reject & Send Feedback
                    </h2>
                    <button onClick={() => setRejectOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                  </div>
                  <form className="space-y-4" onSubmit={handleRejectSubmit}>
                    <p className="text-xs text-gray-400">
                      Rejecting <span className="text-white font-mono">{selected?.id}</span>. Your feedback will be sent directly to the developer.
                    </p>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Rejection Reason <span className="text-red-400">*</span></label>
                      <textarea required rows={4}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 resize-none"
                        placeholder="Be specific (e.g., 'Use redis:7.2-alpine not latest. Adding memcached needs its own separate CR.')"
                        value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                    </div>
                    <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
                      <GlowButton type="button" variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</GlowButton>
                      <GlowButton type="submit" variant="danger">Confirm Rejection</GlowButton>
                    </div>
                  </form>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── Queue View ───────────────────────────────────────────────────────────
  const displayCRs = tab === 'queue' ? pendingCRs : allCRs;

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Approval Pipeline</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Audit submitted Change Requests, verify they pass the FCA, then approve or reject.
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('queue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'queue' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
          Pending Queue
          {pendingCRs.length > 0 && <span className="ml-2 bg-violet-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCRs.length}</span>}
        </button>
        <button onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
          All Requests
        </button>
      </div>

      <GlassCard className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {displayCRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-600 gap-2">
              <Check size={32} className="opacity-30" />
              <p className="text-sm">No pending requests. Queue is clear.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-white/[0.02] border-b border-white/5">
                <tr>
                  <th className="px-5 py-3">Request ID</th>
                  <th className="px-5 py-3">Config File</th>
                  <th className="px-5 py-3">Submitted By</th>
                  <th className="px-5 py-3">Environment</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayCRs.map((cr, idx) => (
                  <motion.tr key={cr.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelected(cr)}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-300">{cr.id}</td>
                    <td className="px-5 py-3 font-mono text-xs text-cyan-400">{cr.configName}</td>
                    <td className="px-5 py-3 text-xs text-gray-300">
                      <div className="flex items-center gap-1.5"><User size={12} /> {cr.submittedBy}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 capitalize">{cr.environment}</td>
                    <td className="px-5 py-3"><Badge variant={cr.severity as BadgeVariant}>{cr.severity}</Badge></td>
                    <td className="px-5 py-3"><Badge variant={statusBadge[cr.status]}>{cr.status}</Badge></td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1"><Clock size={11} />{cr.submittedAt}</div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight size={16} className="text-gray-500 inline" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
