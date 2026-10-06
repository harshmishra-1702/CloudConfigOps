import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Key, Bell, Check, UserPlus, Settings as SettingsIcon, MoreHorizontal, X } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowButton } from '../components/ui/GlowButton';
import { Badge, BadgeVariant } from '../components/ui/Badge';

const tabs = [
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
];

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Reviewer' | 'Developer';
  status: 'Active' | 'Invited';
}

const INITIAL_USERS: UserRow[] = [
  { id: 1, name: 'Alex (Admin)',        email: 'alex@cloudconfig.ops',    role: 'Admin',     status: 'Active'  },
  { id: 2, name: 'Rachel (Reviewer)',   email: 'rachel@cloudconfig.ops',  role: 'Reviewer',  status: 'Active'  },
  { id: 3, name: 'David (Developer)',   email: 'david@cloudconfig.ops',   role: 'Developer', status: 'Active'  },
  { id: 4, name: 'Carol (Developer)',   email: 'carol@cloudconfig.ops',   role: 'Developer', status: 'Invited' },
];

const getRoleBadge = (role: string): BadgeVariant => {
  return role === 'Admin' ? 'critical' : role === 'Reviewer' ? 'pending' : 'deployed';
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserRow[]>(INITIAL_USERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Developer' as UserRow['role'] });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(prev => [...prev, { id: Date.now(), ...newUser, status: 'Invited' }]);
    setNewUser({ name: '', email: '', role: 'Developer' });
    setInviteOpen(false);
  };

  const handleRemove = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleRoleChange = (id: number, role: UserRow['role']) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings & Administration</h1>
        <p className="text-gray-400 mt-1 text-sm">Manage users, roles, and workspace security policies.</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-[220px] shrink-0 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                activeTab === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}>
              <Icon size={16} className={activeTab === id ? 'text-cyan-400' : ''} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <GlassCard className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Users & Roles</h2>
                  <p className="text-xs text-gray-400 mt-1">Manage team members. Roles control access to all features.</p>
                </div>
                <GlowButton size="sm" onClick={() => setInviteOpen(true)}>
                  <UserPlus size={15} className="mr-1.5" /> Invite User
                </GlowButton>
              </div>

              {/* Role descriptions */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { role: 'Admin (Ops)', color: 'border-red-500/30 bg-red-500/5', desc: 'Live monitoring, PCA drift management, rollback execution, audit oversight, and user management.' },
                  { role: 'Reviewer',    color: 'border-violet-500/30 bg-violet-500/5', desc: 'Conducts Functional Configuration Audits, approves or rejects Change Requests. Cannot edit configs.' },
                  { role: 'Developer',   color: 'border-cyan-500/30 bg-cyan-500/5', desc: 'Authors configuration files, commits changes, submits CRs. Cannot deploy or approve their own changes.' },
                ].map(({ role, color, desc }) => (
                  <div key={role} className={`p-3 rounded-lg border ${color}`}>
                    <h4 className="text-xs font-semibold text-white mb-1">{role}</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Users Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 border-b border-white/10 text-xs text-gray-400 uppercase">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold text-xs">
                              {u.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm text-gray-200 font-medium">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value as UserRow['role'])}
                            className="bg-[#1a1a2e] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500/50 [&>option]:bg-[#1a1a2e] [&>option]:text-white"
                          >
                            <option value="Developer">Developer</option>
                            <option value="Reviewer">Reviewer</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {u.status === 'Active' ? <Check size={13} className="text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-yellow-400" />}
                            <span className="text-xs text-gray-400">{u.status}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {u.id !== 1 && (
                            <button onClick={() => handleRemove(u.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded">
                              <X size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab !== 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
              <SettingsIcon size={40} className="opacity-20" />
              <p className="text-sm">This section is under construction.</p>
            </motion.div>
          )}
        </GlassCard>
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-md">
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-white">Invite New User</h2>
                <button onClick={() => setInviteOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
              </div>
              <form className="space-y-4" onSubmit={handleInvite}>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                  <input required className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                  <input required type="email" className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Role</label>
                  <select required className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as UserRow['role'] }))}>
                    <option value="Developer">Developer</option>
                    <option value="Reviewer">Reviewer</option>
                    <option value="Admin">Admin (Ops)</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
                  <GlowButton type="button" variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</GlowButton>
                  <GlowButton type="submit">Send Invitation</GlowButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
