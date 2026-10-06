import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Send, FileCode, AlertCircle, RotateCcw } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { GlowButton } from '../components/ui/GlowButton';
import { useAuth, useAppState } from '../lib/AuthContext';

const statusIcon: Record<string, React.ReactNode> = {
  draft:    <Clock size={15} className="text-gray-400" />,
  pending:  <Clock size={15} className="text-violet-400" />,
  reviewing:<Clock size={15} className="text-blue-400" />,
  approved: <CheckCircle size={15} className="text-emerald-400" />,
  rejected: <XCircle size={15} className="text-red-400" />,
  deployed: <Send size={15} className="text-cyan-400" />,
  baselined:<CheckCircle size={15} className="text-teal-400" />,
};

const statusBadgeVariant: Record<string, BadgeVariant> = {
  draft: 'low', pending: 'pending', reviewing: 'medium',
  approved: 'success', rejected: 'critical', deployed: 'deployed', baselined: 'deployed',
};

export default function MyRequests() {
  const { user } = useAuth();
  const { changeRequests, addChangeRequest, addAuditEntry } = useAppState();

  const myCRs = changeRequests.filter(cr => cr.submittedBy === user?.name);

  const counts = {
    pending:  myCRs.filter(r => r.status === 'pending' || r.status === 'reviewing').length,
    approved: myCRs.filter(r => r.status === 'approved' || r.status === 'deployed' || r.status === 'baselined').length,
    rejected: myCRs.filter(r => r.status === 'rejected').length,
    draft:    myCRs.filter(r => r.status === 'draft').length,
  };

  const handleRework = (crId: string) => {
    // Rework: reset rejected CR back to draft state
    const cr = myCRs.find(c => c.id === crId);
    if (!cr || !user) return;
    addChangeRequest({
      ...cr,
      id: `CR-${Date.now()}`,
      status: 'draft',
      submittedAt: 'just now',
      reviewerFeedback: undefined,
    });
    addAuditEntry({
      id: `AU-${Date.now()}`,
      crId: crId,
      action: 'REWORKED',
      performedBy: user.name,
      role: 'Developer',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      details: `Developer reworked rejected ${crId} — new draft created.`,
    });
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Submissions</h1>
        <p className="text-gray-400 mt-1 text-sm">Track all Change Requests you have submitted. Rework rejected drafts based on reviewer feedback.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending / In Review', count: counts.pending, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Approved / Deployed', count: counts.approved, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Rejected (Action Needed)', count: counts.rejected, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Draft', count: counts.draft, color: 'text-gray-400', bg: 'bg-white/5' },
        ].map(({ label, count, color, bg }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
              <span className={`text-lg font-bold ${color}`}>{count}</span>
            </div>
            <p className="text-xs text-gray-400 leading-snug">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* CR Table */}
      <GlassCard className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-medium text-white text-sm">All Change Requests</h3>
          <span className="text-xs text-gray-500">{myCRs.length} total</span>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="px-5 py-3 font-medium">Config File</th>
                <th className="px-5 py-3 font-medium">Version</th>
                <th className="px-5 py-3 font-medium">Environment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Reviewer Feedback</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {myCRs.map((cr, idx) => (
                <motion.tr key={cr.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon[cr.status]}
                      <span className="font-mono text-xs text-gray-300">{cr.id}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-[160px] truncate">{cr.commitMessage}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs">
                      <FileCode size={13} /> {cr.configName}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 font-mono">v{cr.version}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 capitalize">{cr.environment}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusBadgeVariant[cr.status]}>{cr.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{cr.submittedAt}</td>
                  <td className="px-5 py-3 max-w-[220px]">
                    {cr.reviewerFeedback ? (
                      <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 leading-relaxed">
                        <span className="font-bold block mb-1">Reviewer:</span>
                        {cr.reviewerFeedback}
                      </div>
                    ) : cr.approvedBy ? (
                      <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={12} /> Approved by {cr.approvedBy}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {cr.status === 'rejected' && (
                      <GlowButton size="sm" variant="secondary" onClick={() => handleRework(cr.id)}>
                        <RotateCcw size={13} className="mr-1" /> Rework
                      </GlowButton>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
