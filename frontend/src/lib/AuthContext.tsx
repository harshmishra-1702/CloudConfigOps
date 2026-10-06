import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'developer' | 'reviewer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

// ─── Shared Application State (simulates a DB) ────────────────────────────────

export interface ChangeRequest {
  id: string;
  configId: string;
  configName: string;
  version: string;
  environment: 'development' | 'testing' | 'production';
  owner: string;
  submittedBy: string;
  submittedAt: string;
  status: 'draft' | 'pending' | 'reviewing' | 'approved' | 'rejected' | 'deployed' | 'baselined';
  severity: 'critical' | 'high' | 'medium' | 'low';
  commitMessage: string;
  reviewerFeedback?: string;
  approvedBy?: string;
  approvedAt?: string;
  deployedAt?: string;
  fileContent?: string;
  previousContent?: string;
}

export interface ConfigItem {
  id: string;
  name: string;
  type: 'env' | 'yaml' | 'json' | 'conf' | 'properties';
  environment: 'development' | 'testing' | 'production';
  owner: string;
  version: string;
  lastModified: string;
  status: 'draft' | 'pending' | 'approved' | 'baselined';
  content: string;
  hash: string;
  liveHash?: string;
}

export interface DriftAlert {
  id: string;
  configId: string;
  configName: string;
  environment: string;
  detectedAt: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  expectedHash: string;
  actualHash: string;
  status: 'active' | 'resolved' | 'rolled_back';
}

export interface AuditEntry {
  id: string;
  crId: string;
  action: string;
  performedBy: string;
  role: string;
  timestamp: string;
  details: string;
}

// ─── Initial mock data ─────────────────────────────────────────────────────────
const INITIAL_CONFIG_ITEMS: ConfigItem[] = [
  {
    id: 'CI-001', name: '.env.production', type: 'env', environment: 'production',
    owner: 'David (Developer)', version: '1.4.2', lastModified: '2h ago', status: 'approved',
    content: 'NODE_ENV=production\nPORT=8080\nDB_HOST=db-prod.internal\nDB_USER=admin\nDB_PASS=super_secret_123\nJWT_SECRET=jwt_prod_key_xyz\nREDIS_URL=redis://cache.internal:6379',
    hash: 'sha256:a1b2c3d4e5f6', liveHash: 'sha256:a1b2c3d4e5f6'
  },
  {
    id: 'CI-002', name: 'nginx.conf', type: 'conf', environment: 'production',
    owner: 'Ops Team', version: '2.1.0', lastModified: '1d ago', status: 'baselined',
    content: 'server {\n    listen 80;\n    server_name api.example.com;\n    worker_processes 2;\n\n    location / {\n        proxy_pass http://localhost:8080;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    }\n}',
    hash: 'sha256:deadbeef1234', liveHash: 'sha256:cafebabe9999'
  },
  {
    id: 'CI-003', name: 'docker-compose.yml', type: 'yaml', environment: 'development',
    owner: 'David (Developer)', version: '1.0.0', lastModified: '5d ago', status: 'draft',
    content: 'version: "3.8"\nservices:\n  app:\n    image: myapp:latest\n    ports:\n      - "8080:8080"\n    environment:\n      - NODE_ENV=development\n  redis:\n    image: redis:7.2-alpine\n    ports:\n      - "6379:6379"',
    hash: 'sha256:fedcba654321', liveHash: 'sha256:fedcba654321'
  },
  {
    id: 'CI-004', name: 'application.properties', type: 'properties', environment: 'testing',
    owner: 'David (Developer)', version: '1.1.0', lastModified: '2d ago', status: 'pending',
    content: 'spring.datasource.url=jdbc:postgresql://test-db:5432/testdb\nspring.datasource.username=testuser\nspring.jpa.hibernate.ddl-auto=validate\nlogging.level.root=INFO',
    hash: 'sha256:11223344aabb', liveHash: 'sha256:11223344aabb'
  },
  {
    id: 'CI-005', name: 'deployment.yaml', type: 'yaml', environment: 'production',
    owner: 'Ops Team', version: '3.0.0', lastModified: '1w ago', status: 'baselined',
    content: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: cloudconfig-app\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: cloudconfig\n  template:\n    spec:\n      containers:\n      - name: app\n        image: myapp:v3.0.0\n        resources:\n          limits:\n            memory: "512Mi"\n            cpu: "500m"',
    hash: 'sha256:99887766aabb', liveHash: 'sha256:99887766aabb'
  },
  {
    id: 'CI-006', name: 'config.json', type: 'json', environment: 'production',
    owner: 'David (Developer)', version: '2.0.1', lastModified: '3d ago', status: 'approved',
    content: '{\n  "appName": "CloudConfig Ops",\n  "logLevel": "warn",\n  "maxRetries": 3,\n  "timeout": 30000,\n  "features": {\n    "darkMode": true,\n    "notifications": true,\n    "analytics": false\n  },\n  "cors": {\n    "origins": ["https://app.cloudconfig.ops"],\n    "credentials": true\n  }\n}',
    hash: 'sha256:ff11ee22dd33', liveHash: 'sha256:ff11ee22dd33'
  },
  {
    id: 'CI-007', name: '.env.staging', type: 'env', environment: 'testing',
    owner: 'David (Developer)', version: '1.0.3', lastModified: '4d ago', status: 'approved',
    content: 'NODE_ENV=staging\nPORT=8080\nDB_HOST=db-staging.internal\nDB_USER=staging_user\nDB_PASS=staging_pass_456\nJWT_SECRET=jwt_staging_key\nLOG_LEVEL=debug\nENABLE_SWAGGER=true',
    hash: 'sha256:aabb11223344', liveHash: 'sha256:aabb11223344'
  },
  {
    id: 'CI-008', name: 'prometheus.yml', type: 'yaml', environment: 'production',
    owner: 'Ops Team', version: '1.2.0', lastModified: '1w ago', status: 'baselined',
    content: 'global:\n  scrape_interval: 15s\n  evaluation_interval: 15s\n\nscrape_configs:\n  - job_name: "cloudconfig-api"\n    static_configs:\n      - targets: ["localhost:8080"]\n  - job_name: "node-exporter"\n    static_configs:\n      - targets: ["localhost:9100"]',
    hash: 'sha256:prom11223344', liveHash: 'sha256:prom11223344'
  },
  {
    id: 'CI-009', name: 'Caddyfile', type: 'conf', environment: 'development',
    owner: 'Carol (Developer)', version: '1.0.0', lastModified: '6d ago', status: 'draft',
    content: ':2015 {\n  root * /srv\n  file_server\n  reverse_proxy /api/* localhost:8080\n  log {\n    output file /var/log/caddy/access.log\n  }\n}',
    hash: 'sha256:caddy1234abcd', liveHash: 'sha256:caddy1234abcd'
  },
];

const INITIAL_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: 'CR-1045', configId: 'CI-002', configName: 'nginx.conf', version: '2.1.1',
    environment: 'production', owner: 'David (Developer)', submittedBy: 'David (Developer)',
    submittedAt: '10 mins ago', status: 'pending', severity: 'high',
    commitMessage: 'Update worker_processes from 2 to 4 to handle higher load during peak hours',
    fileContent: 'server {\n    listen 80;\n    server_name api.example.com;\n    worker_processes 4;\n\n    location / {\n        proxy_pass http://localhost:8080;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    }\n}',
    previousContent: 'server {\n    listen 80;\n    server_name api.example.com;\n    worker_processes 2;\n\n    location / {\n        proxy_pass http://localhost:8080;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    }\n}',
  },
  {
    id: 'CR-1044', configId: 'CI-001', configName: '.env.production', version: '1.4.3',
    environment: 'production', owner: 'David (Developer)', submittedBy: 'David (Developer)',
    submittedAt: '3h ago', status: 'reviewing', severity: 'critical',
    commitMessage: 'Rotate API keys and update JWT secret after security audit',
    fileContent: 'NODE_ENV=production\nPORT=8080\nDB_HOST=db-prod.internal\nDB_USER=admin\nDB_PASS=NEW_SECRET_ROTATED_456\nJWT_SECRET=jwt_prod_key_ROTATED_2026\nREDIS_URL=redis://cache.internal:6379',
    previousContent: 'NODE_ENV=production\nPORT=8080\nDB_HOST=db-prod.internal\nDB_USER=admin\nDB_PASS=super_secret_123\nJWT_SECRET=jwt_prod_key_xyz\nREDIS_URL=redis://cache.internal:6379',
  },
  {
    id: 'CR-1043', configId: 'CI-003', configName: 'docker-compose.yml', version: '1.1.0',
    environment: 'development', owner: 'David (Developer)', submittedBy: 'David (Developer)',
    submittedAt: '1d ago', status: 'rejected', severity: 'medium',
    commitMessage: 'Bump redis to latest and add memcached service',
    reviewerFeedback: 'REJECTED: Please use redis:7.2-alpine instead of "latest" tag. Using "latest" is not deterministic and violates our pinned-version policy. Also, adding memcached requires a separate Change Request — do not bundle unrelated changes.',
    fileContent: 'version: "3.8"\nservices:\n  app:\n    image: myapp:latest\n  redis:\n    image: redis:latest\n  memcached:\n    image: memcached:latest',
    previousContent: 'version: "3.8"\nservices:\n  app:\n    image: myapp:latest\n  redis:\n    image: redis:7.2-alpine',
  },
  {
    id: 'CR-1041', configId: 'CI-004', configName: 'application.properties', version: '1.2.0',
    environment: 'testing', owner: 'David (Developer)', submittedBy: 'David (Developer)',
    submittedAt: '3d ago', status: 'approved', severity: 'low',
    commitMessage: 'Increase connection pool size for load testing',
    approvedBy: 'Rachel (Reviewer)', approvedAt: '2d ago',
  },
  {
    id: 'CR-1039', configId: 'CI-005', configName: 'deployment.yaml', version: '3.1.0',
    environment: 'production', owner: 'Ops Team', submittedBy: 'David (Developer)',
    submittedAt: '1w ago', status: 'deployed', severity: 'medium',
    commitMessage: 'Scale replicas from 3 to 5 for Q3 load',
    approvedBy: 'Rachel (Reviewer)', approvedAt: '6d ago', deployedAt: '5d ago',
  },
];

const INITIAL_DRIFT_ALERTS: DriftAlert[] = [
  {
    id: 'DA-001', configId: 'CI-002', configName: 'nginx.conf', environment: 'production',
    detectedAt: '5 mins ago', severity: 'critical',
    expectedHash: 'sha256:deadbeef1234', actualHash: 'sha256:cafebabe9999',
    status: 'active'
  },
  {
    id: 'DA-002', configId: 'CI-001', configName: '.env.production', environment: 'production',
    detectedAt: '2 hours ago', severity: 'high',
    expectedHash: 'sha256:a1b2c3d4e5f6', actualHash: 'sha256:999aaa111bbb',
    status: 'active'
  },
];

const INITIAL_AUDIT_LOG: AuditEntry[] = [
  { id: 'AU-010', crId: 'CR-1039', action: 'DEPLOYED', performedBy: 'Alex (Admin)', role: 'Admin', timestamp: '5 days ago 14:32 IST', details: 'Deployed CR-1039 to production. deployment.yaml v3.1.0 applied.' },
  { id: 'AU-009', crId: 'CR-1039', action: 'APPROVED', performedBy: 'Rachel (Reviewer)', role: 'Reviewer', timestamp: '6 days ago 11:10 IST', details: 'FCA passed. Syntax valid. No unauthorized bundled changes.' },
  { id: 'AU-008', crId: 'CR-1039', action: 'SUBMITTED', performedBy: 'David (Developer)', role: 'Developer', timestamp: '7 days ago 09:00 IST', details: 'CR-1039 submitted for review.' },
  { id: 'AU-007', crId: 'CR-1043', action: 'REJECTED', performedBy: 'Rachel (Reviewer)', role: 'Reviewer', timestamp: '1 day ago 16:00 IST', details: 'FCA failed — pinned version violation and bundled unrelated change.' },
  { id: 'AU-006', crId: 'CR-1044', action: 'SUBMITTED', performedBy: 'David (Developer)', role: 'Developer', timestamp: '3 hours ago 19:30 IST', details: 'CR-1044 submitted for security key rotation.' },
  { id: 'AU-005', crId: 'CR-1045', action: 'SUBMITTED', performedBy: 'David (Developer)', role: 'Developer', timestamp: '10 mins ago 22:33 IST', details: 'CR-1045 submitted for nginx worker_processes update.' },
];

// ─── Context ────────────────────────────────────────────────────────────────────

interface AppState {
  configItems: ConfigItem[];
  changeRequests: ChangeRequest[];
  driftAlerts: DriftAlert[];
  auditLog: AuditEntry[];
  updateChangeRequest: (id: string, updates: Partial<ChangeRequest>) => void;
  addChangeRequest: (cr: ChangeRequest) => void;
  addAuditEntry: (entry: AuditEntry) => void;
  resolveDriftAlert: (id: string) => void;
  rollbackConfig: (alertId: string) => void;
  updateConfigItem: (id: string, updates: Partial<ConfigItem>) => void;
}

interface AuthContextType {
  user: User | null;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AppStateContext = createContext<AppState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [configItems, setConfigItems] = useState<ConfigItem[]>(INITIAL_CONFIG_ITEMS);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(INITIAL_CHANGE_REQUESTS);
  const [driftAlerts, setDriftAlerts] = useState<DriftAlert[]>(INITIAL_DRIFT_ALERTS);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(INITIAL_AUDIT_LOG);

  const login = (role: Role) => {
    const users: Record<Role, User> = {
      admin: { id: '1', name: 'Alex (Admin)', email: 'alex@cloudconfig.ops', role: 'admin', avatar: 'AA' },
      reviewer: { id: '2', name: 'Rachel (Reviewer)', email: 'rachel@cloudconfig.ops', role: 'reviewer', avatar: 'RR' },
      developer: { id: '3', name: 'David (Developer)', email: 'david@cloudconfig.ops', role: 'developer', avatar: 'DD' },
    };
    setUser(users[role]);
  };

  const logout = () => setUser(null);

  const updateChangeRequest = (id: string, updates: Partial<ChangeRequest>) => {
    setChangeRequests(prev => prev.map(cr => cr.id === id ? { ...cr, ...updates } : cr));
  };

  const addChangeRequest = (cr: ChangeRequest) => {
    setChangeRequests(prev => [cr, ...prev]);
  };

  const addAuditEntry = (entry: AuditEntry) => {
    setAuditLog(prev => [entry, ...prev]);
  };

  const resolveDriftAlert = (id: string) => {
    setDriftAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  };

  const rollbackConfig = (alertId: string) => {
    setDriftAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'rolled_back' } : a));
  };

  const updateConfigItem = (id: string, updates: Partial<ConfigItem>) => {
    setConfigItems(prev => prev.map(ci => ci.id === id ? { ...ci, ...updates } : ci));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <AppStateContext.Provider value={{
        configItems, changeRequests, driftAlerts, auditLog,
        updateChangeRequest, addChangeRequest, addAuditEntry, resolveDriftAlert, rollbackConfig, updateConfigItem
      }}>
        {children}
      </AppStateContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AuthProvider');
  return context;
};
