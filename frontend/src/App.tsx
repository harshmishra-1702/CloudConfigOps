import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Shield, LayoutDashboard, FileCode2, GitPullRequest,
  Search, Bell, Settings as SettingsIcon, History,
  AlertTriangle, ShieldAlert, CheckSquare, Code,
  X, LogOut, Clock, ListChecks, Menu
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ConfigManager from './pages/ConfigManager';
import ChangeRequests from './pages/ChangeRequests';
import Baselines from './pages/Baselines';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import MyRequests from './pages/MyRequests';

import { cn } from './lib/utils';
import { AuthProvider, useAuth, useAppState, Role } from './lib/AuthContext';

// ─── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: Role[] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};

// ─── App Shell ─────────────────────────────────────────────────────────────────
function AppLayout() {
  const { user, logout } = useAuth();
  const { driftAlerts } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeDriftCount = driftAlerts.filter(a => a.status === 'active').length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  if (!user) return <Login />;

  // Dynamic nav based on role
  const allLinks = [
    { name: 'Command Center',    path: '/command-center', icon: LayoutDashboard, roles: ['admin'] as Role[] },
    { name: 'Config Repository', path: '/repository',     icon: FileCode2,       roles: ['developer'] as Role[] },
    { name: 'My Submissions',    path: '/my-requests',    icon: ListChecks,      roles: ['developer'] as Role[] },
    { name: 'Approval Pipeline', path: '/approvals',      icon: CheckSquare,     roles: ['reviewer'] as Role[] },
    { name: 'Baselines & Rollback', path: '/baselines',   icon: History,         roles: ['admin'] as Role[] },
    { name: 'Settings & Users',  path: '/settings',       icon: SettingsIcon,    roles: ['admin'] as Role[] },
  ];
  const visibleLinks = allLinks.filter(l => l.roles.includes(user.role));

  const roleColor: Record<string, string> = {
    admin: 'text-emerald-400',
    reviewer: 'text-violet-400',
    developer: 'text-cyan-400',
  };
  const roleBg: Record<string, string> = {
    admin: 'bg-emerald-500/10',
    reviewer: 'bg-violet-500/10',
    developer: 'bg-cyan-500/10',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ─── Sidebar ─── */}
      <div className={cn('bg-[#0d0d13] border-r border-white/5 flex flex-col z-20 h-full fixed left-0 top-0 transition-all duration-300', isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]')}>
        {/* Logo */}
        <div className={cn('h-16 flex items-center border-b border-white/10 shrink-0', isSidebarCollapsed ? 'justify-center px-0' : 'px-6 gap-3')}>
          <div className="bg-cyan-500/20 p-2 rounded-lg text-cyan-400 shrink-0">
            <Shield size={22} />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="font-bold text-sm tracking-wide text-white whitespace-nowrap">Cloud<span className="text-cyan-400">Config</span></span>
              <span className="text-[10px] font-medium text-gray-500 tracking-widest uppercase whitespace-nowrap">Ops Platform</span>
            </div>
          )}
        </div>

        {/* Role badge */}
        <div className={cn('mx-4 mt-4 mb-2 rounded-lg flex items-center justify-center transition-all', roleBg[user.role], isSidebarCollapsed ? 'p-2 mx-2' : 'px-3 py-2 gap-2')}>
          {user.role === 'admin' && <LayoutDashboard size={14} className={roleColor[user.role]} />}
          {user.role === 'reviewer' && <CheckSquare size={14} className={roleColor[user.role]} />}
          {user.role === 'developer' && <Code size={14} className={roleColor[user.role]} />}
          {!isSidebarCollapsed && (
            <span className={cn('text-xs font-semibold uppercase tracking-widest', roleColor[user.role])}>
              {user.role === 'admin' ? 'Ops / Admin' : user.role}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                title={isSidebarCollapsed ? link.name : undefined}
                className={({ isActive }) => cn(
                  'flex items-center rounded-lg transition-all duration-200 text-sm font-medium',
                  isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                  isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-cyan-400' : ''} />
                    {!isSidebarCollapsed && <span className="whitespace-nowrap">{link.name}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className={cn('p-4 border-t border-white/10 shrink-0', isSidebarCollapsed ? 'p-2' : 'p-4')}>
          <div className={cn('flex items-center bg-white/[0.03] rounded-lg border border-white/5', isSidebarCollapsed ? 'p-2 justify-center flex-col gap-2' : 'px-3 py-2 gap-3')}>
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0', roleBg[user.role])}>
              <span className={roleColor[user.role]}>{user.avatar}</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-200 truncate">{user.name}</span>
                <span className="text-[10px] text-gray-500 truncate">{user.email}</span>
              </div>
            )}
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className={cn('flex-1 flex flex-col h-full overflow-hidden transition-all duration-300', isSidebarCollapsed ? 'ml-[80px]' : 'ml-[260px]')}>
        {/* TopBar */}
        <header className="h-14 bg-[#0d0d13]/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-6 z-30 sticky top-0 shrink-0">
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
              <input
                type="text"
                placeholder="Search configs, requests, alerts..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2" ref={notifRef}>
            {/* Drift Alert Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={cn(
                  'relative p-2 rounded-lg transition-colors',
                  notifOpen ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Bell size={18} />
                {activeDriftCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1 animate-pulse">
                    {activeDriftCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    className="absolute right-0 top-11 w-[360px] bg-[#12121e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/5 bg-red-500/10 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="font-semibold text-red-300 text-xs">PCA Drift Alerts ({activeDriftCount} Active)</span>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto divide-y divide-white/5">
                      {driftAlerts.filter(a => a.status === 'active').map((alert) => (
                        <div key={alert.id} className="p-3 hover:bg-white/5">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-white">{alert.configName}</span>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded', alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400')}>
                              {alert.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-1">Env: {alert.environment} • Detected {alert.detectedAt}</p>
                          <p className="text-[10px] font-mono text-gray-500">Expected: {alert.expectedHash}</p>
                          <p className="text-[10px] font-mono text-red-400">  Actual: {alert.actualHash}</p>
                        </div>
                      ))}
                      {activeDriftCount === 0 && (
                        <div className="p-4 text-center text-gray-500 text-xs">No active drift alerts</div>
                      )}
                    </div>
                    {user.role === 'admin' && (
                      <div className="p-2 border-t border-white/5">
                        <button className="w-full text-xs text-center text-cyan-400 hover:text-white py-1 rounded hover:bg-white/5 transition-colors"
                          onClick={() => { setNotifOpen(false); navigate('/baselines'); }}>
                          Go to Baselines → Execute Rollback
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <Navigate to={
                  user.role === 'admin' ? '/command-center' :
                  user.role === 'reviewer' ? '/approvals' :
                  '/repository'
                } replace />
              } />
              <Route path="/command-center" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
              <Route path="/repository"     element={<ProtectedRoute allowedRoles={['developer']}><ConfigManager /></ProtectedRoute>} />
              <Route path="/my-requests"    element={<ProtectedRoute allowedRoles={['developer']}><MyRequests /></ProtectedRoute>} />
              <Route path="/approvals"      element={<ProtectedRoute allowedRoles={['reviewer', 'admin']}><ChangeRequests /></ProtectedRoute>} />
              <Route path="/baselines"      element={<ProtectedRoute allowedRoles={['admin']}><Baselines /></ProtectedRoute>} />
              <Route path="/settings"       element={<ProtectedRoute allowedRoles={['admin']}><SettingsPage /></ProtectedRoute>} />
              <Route path="/unauthorized"   element={<Unauthorized />} />
              <Route path="*"               element={<Navigate to="/unauthorized" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
