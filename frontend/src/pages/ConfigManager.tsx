import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, FileText, FileCode, FileJson, X, GitCommit, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowButton } from '../components/ui/GlowButton';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { useAuth, useAppState, ChangeRequest, ConfigItem } from '../lib/AuthContext';

const fileIcons: Record<string, React.ReactNode> = {
  env: <FileCode size={15} className="text-emerald-400" />,
  conf: <FileText size={15} className="text-cyan-400" />,
  yaml: <FileJson size={15} className="text-violet-400" />,
  json: <FileJson size={15} className="text-yellow-400" />,
  properties: <FileText size={15} className="text-orange-400" />,
};

export default function ConfigManager() {
  const { user } = useAuth();
  const { configItems, changeRequests, addChangeRequest, addAuditEntry } = useAppState();

  const [selectedCI, setSelectedCI] = useState<ConfigItem | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [form, setForm] = useState({ configId: '', configName: '', version: '', environment: 'development' as ChangeRequest['environment'], commitMessage: '' });
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState('');

  // Developer-owned CIs
  const myItems = configItems.filter(ci => ci.owner === user?.name);
  const filtered = myItems.filter(ci => ci.name.toLowerCase().includes(filter.toLowerCase()));

  const handleSelectCI = (ci: ConfigItem) => {
    setSelectedCI(ci);
    setEditedContent(ci.content);
  };

  const handleOpenSubmit = () => {
    if (!selectedCI) return;
    setForm({
      configId: selectedCI.id,
      configName: selectedCI.name,
      version: bumpVersion(selectedCI.version),
      environment: selectedCI.environment,
      commitMessage: '',
    });
    setIsSubmitOpen(true);
  };

  const bumpVersion = (v: string) => {
    const parts = v.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCI) return;

    const newCR: ChangeRequest = {
      id: `CR-${Date.now()}`,
      configId: form.configId,
      configName: form.configName,
      version: form.version,
      environment: form.environment,
      owner: user.name,
      submittedBy: user.name,
      submittedAt: 'just now',
      status: 'pending',
      severity: 'medium',
      commitMessage: form.commitMessage,
      fileContent: editedContent,
      previousContent: selectedCI.content,
    };

    addChangeRequest(newCR);
    addAuditEntry({
      id: `AU-${Date.now()}`,
      crId: newCR.id,
      action: 'SUBMITTED',
      performedBy: user.name,
      role: 'Developer',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      details: `${newCR.id} submitted for review. File: ${form.configName} v${form.version}`,
    });

    setIsSubmitOpen(false);
    setSuccessMsg(`✓ Change Request ${newCR.id} submitted for review.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getStatusVariant = (status: string): BadgeVariant => {
    const map: Record<string, BadgeVariant> = { draft: 'low', pending: 'pending', approved: 'success', baselined: 'deployed' };
    return map[status] || 'low';
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Configuration Repository</h1>
        <p className="text-gray-400 mt-1 text-sm">Browse and edit your Configuration Items. Submit a formal Change Request for every modification.</p>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-lg text-sm">
            <CheckCircle size={16} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* ─── File Tree ─── */}
        <GlassCard className="w-[32%] flex flex-col min-h-0">
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-2 text-gray-500" size={14} />
              <input type="text" placeholder="Filter files..." value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-md py-1.5 pl-8 pr-3 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-[10px] uppercase tracking-widest text-gray-600 px-2 py-2">My Configuration Items</div>
            {filtered.length === 0 && <p className="text-xs text-gray-600 px-2">No items found.</p>}
            {filtered.map(ci => (
              <button key={ci.id}
                onClick={() => handleSelectCI(ci)}
                className={`w-full flex items-center justify-between px-2 py-2 text-xs rounded-md transition-colors mb-1 ${selectedCI?.id === ci.id ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  {fileIcons[ci.type] || <FileText size={15} />}
                  <span className="truncate">{ci.name}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <Badge variant={getStatusVariant(ci.status)}>{ci.status}</Badge>
                  <span className="text-[10px] text-gray-600">v{ci.version}</span>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ─── Editor ─── */}
        <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {selectedCI ? (
            <>
              {/* Tab bar */}
              <div className="flex items-center border-b border-white/5 bg-black/10">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-r border-white/5">
                  {fileIcons[selectedCI.type]}
                  <span className="text-xs font-medium text-gray-200">{selectedCI.name}</span>
                  <button className="ml-2 text-gray-500 hover:text-white" onClick={() => setSelectedCI(null)}><X size={12} /></button>
                </div>
                <div className="flex-1 px-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Env: <span className="text-gray-300 capitalize">{selectedCI.environment}</span></span>
                    <span>·</span>
                    <span>Owner: <span className="text-gray-300">{selectedCI.owner}</span></span>
                    <span>·</span>
                    <span>Version: <span className="text-gray-300">v{selectedCI.version}</span></span>
                  </div>
                </div>
                <div className="px-3 py-2 text-xs text-yellow-500 flex items-center gap-1.5 shrink-0">
                  <AlertCircle size={12} /> Changes require CR submission
                </div>
              </div>

              {/* Code editor */}
              <div className="flex-1 flex bg-[#0a0a10] overflow-hidden">
                <div className="w-10 border-r border-white/5 bg-black/20 text-gray-600 font-mono text-xs py-4 text-right pr-2.5 select-none shrink-0">
                  {editedContent.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <textarea
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  className="flex-1 bg-transparent text-gray-200 font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Toolbar */}
              <div className="p-3 border-t border-white/5 bg-black/10 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {editedContent !== selectedCI.content ? (
                    <span className="text-yellow-400 flex items-center gap-1"><AlertCircle size={12}/> Unsaved changes</span>
                  ) : (
                    <span className="text-gray-600">No changes</span>
                  )}
                </div>
                <GlowButton size="sm" onClick={handleOpenSubmit} disabled={editedContent === selectedCI.content}>
                  <GitCommit size={14} className="mr-1.5" /> Submit Change Request
                </GlowButton>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
              <FileCode size={44} className="opacity-20" />
              <p className="text-sm">Select a Configuration Item from the left to edit</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ─── Submit CR Modal ─── */}
      <AnimatePresence>
        {isSubmitOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg">
              <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <GitCommit size={18} className="text-cyan-400" /> Submit Change Request
                  </h2>
                  <button onClick={() => setIsSubmitOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Configuration ID</label>
                      <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none" value={form.configId} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Config Name</label>
                      <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none" value={form.configName} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">New Version</label>
                      <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Environment</label>
                      <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none capitalize" value={form.environment} readOnly />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Owner</label>
                      <input className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none" value={user?.name} readOnly />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Commit Message / Reason for Change <span className="text-red-400">*</span></label>
                    <textarea required rows={3}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                      placeholder="Describe exactly what changed and why (e.g., Increase worker_processes from 2 to 4 to handle higher traffic)"
                      value={form.commitMessage} onChange={e => setForm(f => ({ ...f, commitMessage: e.target.value }))} />
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 text-xs text-yellow-400 flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    You cannot approve your own Change Requests. Separation of duties is enforced.
                  </div>
                  <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
                    <GlowButton type="button" variant="ghost" onClick={() => setIsSubmitOpen(false)}>Cancel</GlowButton>
                    <GlowButton type="submit">Submit for Reviewer</GlowButton>
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
