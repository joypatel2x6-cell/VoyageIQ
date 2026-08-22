import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users, Map, Globe, Activity, TrendingUp, BarChart2,
  Search, ChevronDown, ChevronUp, Eye, UserX, Trash2,
  Download, Shield, LogOut, AlertTriangle,
  CheckCircle2, Wallet, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight,
  Compass, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
//  Mock Analytics Data
// ─────────────────────────────────────────────────────────────────────────────
const MONTHLY_GROWTH = [
  { month: 'Jan', users: 820,  trips: 1240, revenue: 184000 },
  { month: 'Feb', users: 1120, trips: 1680, revenue: 241000 },
  { month: 'Mar', users: 1540, trips: 2310, revenue: 318000 },
  { month: 'Apr', users: 1890, trips: 2840, revenue: 402000 },
  { month: 'May', users: 2310, trips: 3470, revenue: 521000 },
  { month: 'Jun', users: 2980, trips: 4480, revenue: 672000 },
  { month: 'Jul', users: 3640, trips: 5460, revenue: 819000 },
  { month: 'Aug', users: 4210, trips: 6320, revenue: 948000 },
  { month: 'Sep', users: 5100, trips: 7650, revenue: 1148000 },
  { month: 'Oct', users: 6320, trips: 9480, revenue: 1422000 },
  { month: 'Nov', users: 8140, trips: 12210, revenue: 1831000 },
  { month: 'Dec', users: 12847, trips: 19271, revenue: 2892000 },
];

const POPULAR_DESTINATIONS = [
  { city: 'Paris, France',      trips: 4821, pct: 100, color: '#6366f1' },
  { city: 'Tokyo, Japan',       trips: 4102, pct: 85,  color: '#8b5cf6' },
  { city: 'Rome, Italy',        trips: 3687, pct: 76,  color: '#06b6d4' },
  { city: 'Bali, Indonesia',    trips: 3241, pct: 67,  color: '#10b981' },
  { city: 'New York, USA',      trips: 2918, pct: 60,  color: '#f59e0b' },
  { city: 'Amsterdam, NL',      trips: 2541, pct: 53,  color: '#f43f5e' },
  { city: 'Dubai, UAE',         trips: 2187, pct: 45,  color: '#ec4899' },
  { city: 'Santorini, Greece',  trips: 1962, pct: 41,  color: '#14b8a6' },
  { city: 'Barcelona, Spain',   trips: 1743, pct: 36,  color: '#fb923c' },
  { city: 'Kyoto, Japan',       trips: 1581, pct: 33,  color: '#a78bfa' },
];

const POPULAR_ACTIVITIES = [
  { name: 'Eiffel Tower Visit',      count: 3812, category: 'Sightseeing' },
  { name: 'Seine River Cruise',       count: 2947, category: 'Activity' },
  { name: 'Louvre Museum Tour',       count: 2741, category: 'Culture' },
  { name: 'Colosseum Skip-the-Line',  count: 2614, category: 'Sightseeing' },
  { name: 'Tokyo Street Food Tour',   count: 2498, category: 'Food' },
  { name: 'Bali Rice Terrace Trek',   count: 2103, category: 'Adventure' },
  { name: 'Vatican Museums Tour',     count: 1987, category: 'Culture' },
  { name: 'Canal Boat — Amsterdam',   count: 1812, category: 'Activity' },
  { name: 'Arashiyama Bamboo Walk',   count: 1673, category: 'Nature' },
  { name: 'Santorini Sunset Cruise',  count: 1541, category: 'Activity' },
];

const BUDGET_DISTRIBUTION = [
  { name: 'Accommodation', value: 38, color: '#8b5cf6' },
  { name: 'Transport',     value: 27, color: '#06b6d4' },
  { name: 'Activities',    value: 18, color: '#10b981' },
  { name: 'Food',          value: 12, color: '#f59e0b' },
  { name: 'Other',         value: 5,  color: '#64748b' },
];

const TRAVEL_STYLES = [
  { name: 'Budget',   value: 31, color: '#10b981' },
  { name: 'Balanced', value: 48, color: '#6366f1' },
  { name: 'Luxury',   value: 21, color: '#f59e0b' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────
type UserStatus = 'active' | 'suspended' | 'new';
interface AdminUser {
  id: string;
  name: string;
  email: string;
  country: string;
  trips: number;
  joined: string;
  status: UserStatus;
  avatar: string;
  totalSpend: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  KPI Card
// ─────────────────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string; value: string | number; icon: React.ReactNode;
  change: number; color: string; sub?: string;
}> = ({ label, value, icon, change, color, sub }) => (
  <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', backgroundColor: color + '12' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', fontWeight: 700, color: change >= 0 ? '#10b981' : '#ef4444' }}>
        {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        {Math.abs(change)}%
      </div>
    </div>
    <div>
      <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.675rem', color: 'var(--text-light)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Status Badge
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  const cfg = {
    active:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Active' },
    suspended: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: 'Suspended' },
    new:       { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  label: 'New' },
  }[status];
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 'var(--radius-full)', backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Avatar Initials
// ─────────────────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ initials: string; color?: string }> = ({ initials, color = '#6366f1' }) => (
  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: color + '22', color, fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${color}30` }}>
    {initials}
  </div>
);

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e','#ec4899','#14b8a6','#fb923c','#a78bfa','#34d399','#60a5fa'];

// ─────────────────────────────────────────────────────────────────────────────
//  Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.9rem', fontSize: '0.78rem', fontWeight: 600 }}>
      <div style={{ marginBottom: 6, color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 800 }}>{typeof p.value === 'number' && p.value > 1000 ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Section wrapper
// ─────────────────────────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }> = ({ title, icon, children, action }) => (
  <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', overflow: 'hidden' }}>
    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {action}
    </div>
    <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
//  Admin Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 7;

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers]           = useState<AdminUser[]>(MOCK_USERS);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState<'all' | UserStatus>('all');
  const [sortKey, setSortKey]       = useState<keyof AdminUser>('joined');
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('desc');
  const [page, setPage]             = useState(1);
  const [dateRange, setDateRange]   = useState<'7d' | '30d' | '90d' | '1y'>('1y');
  const [confirmDelete, setConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<'overview' | 'users' | 'destinations' | 'activities'>('overview');

  // Live data state
  const [stats, setStats]           = useState<any>(null);
  const [chartData, setChartData]   = useState(MONTHLY_GROWTH);
  const [popularCities, setCities]  = useState(POPULAR_DESTINATIONS);
  const [popularActs, setPopActs]   = useState(POPULAR_ACTIVITIES);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Fetch all live admin data on mount
  useEffect(() => {
    Promise.allSettled([
      api.admin.getStatistics(),
      api.admin.getUsers({ limit: '50' }),
      api.admin.getUserTrends(),
      api.admin.getPopularCities(10),
      api.admin.getPopularActivities(10),
    ]).then(([statsRes, usersRes, trendsRes, citiesRes, actsRes]) => {
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.data);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        const mapped: AdminUser[] = (usersRes.value.data || []).map((u: any) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          country: u.country || '—',
          trips: u._count?.trips ?? u.tripsCount ?? 0,
          joined: u.createdAt ? u.createdAt.split('T')[0] : '—',
          status: u.isActive === false ? 'suspended' : (u.role === 'new' ? 'new' : 'active') as UserStatus,
          avatar: `${(u.firstName?.[0] || '?')}${(u.lastName?.[0] || '')}`.toUpperCase(),
          totalSpend: u.totalSpend ?? 0,
        }));
        if (mapped.length > 0) setUsers(mapped);
      }
      if (trendsRes.status === 'fulfilled' && trendsRes.value.success && (trendsRes.value.data || []).length > 0) {
        setChartData(trendsRes.value.data);
      }
      if (citiesRes.status === 'fulfilled' && citiesRes.value.success && (citiesRes.value.data || []).length > 0) {
        const max = citiesRes.value.data[0]?.trips ?? 1;
        setCities(citiesRes.value.data.map((c: any, i: number) => ({
          city: c.city || c.name || 'Unknown',
          trips: c.trips ?? c._count ?? 0,
          pct: Math.round(((c.trips ?? c._count ?? 0) / max) * 100),
          color: POPULAR_DESTINATIONS[i % POPULAR_DESTINATIONS.length]?.color || '#6366f1',
        })));
      }
      if (actsRes.status === 'fulfilled' && actsRes.value.success && (actsRes.value.data || []).length > 0) {
        setPopActs(actsRes.value.data.map((a: any) => ({
          name: a.name || a.activity || 'Unknown',
          count: a.count ?? a._count ?? 0,
          category: a.category || 'Activity',
        })));
      }
      setDataLoaded(true);
    });
  }, []);

  // KPI values — prefer live stats, fall back to mock
  const totalUsers    = stats?.totalUsers    ?? 12847;
  const totalTrips    = stats?.totalTrips    ?? 38291;
  const publicTrips   = stats?.publicTrips   ?? 14673;
  const citiesVisited = stats?.totalCities   ?? 892;
  const activitiesAdded = stats?.totalActivities ?? 186450;


  // Filter & sort users
  const filtered = useMemo(() => {
    let list = users.filter(u => {
      const q = search.toLowerCase();
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.country.toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || u.status === statusFilter;
      return matchQ && matchS;
    });
    list = [...list].sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return list;
  }, [users, search, statusFilter, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSort = (key: keyof AdminUser) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleSuspend = (id: string) => {
    const user = users.find(u => u.id === id);
    const nextActive = user?.status === 'suspended'; // if suspended → make active (isActive: true)
    setUsers(prev => prev.map(u => u.id === id
      ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' as UserStatus }
      : u
    ));
    api.admin.updateUserStatus(id, { isActive: nextActive }).catch(() => {
      // Revert on failure
      setUsers(prev => prev.map(u => u.id === id
        ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' as UserStatus }
        : u
      ));
    });
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setConfirm(null);
    api.admin.deleteUser(id).catch(() => {});
  };

  // Slice chart data by date range (works for both live and mock data)
  const rangeMonths = { '7d': 1, '30d': 3, '90d': 6, '1y': 12 }[dateRange];
  const slicedChartData = Array.isArray(chartData) ? chartData.slice(-rangeMonths) : [];

  const SortIcon = ({ k }: { k: keyof AdminUser }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <span style={{ opacity: 0.3 }}><ChevronDown size={12} /></span>;


  const ColHeader: React.FC<{ label: string; k: keyof AdminUser; align?: string }> = ({ label, k, align }) => (
    <th onClick={() => handleSort(k)}
      style={{ padding: '0.75rem 0.9rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', textAlign: (align as any) || 'left', userSelect: 'none', borderBottom: '1px solid var(--border-color-light)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{label} <SortIcon k={k} /></span>
    </th>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Admin Header ─────────────────────────────────────────────────────── */}
      <header style={{ height: 60, backgroundColor: 'var(--bg-dark-accent)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.1 }}>VoyageIQ Analytics</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin Panel</div>
            </div>
          </div>
          {/* Tab nav */}
          <nav style={{ display: 'flex', gap: 2, marginLeft: 24 }}>
            {([
              { key: 'overview', label: 'Overview' },
              { key: 'users', label: 'Users' },
              { key: 'destinations', label: 'Destinations' },
              { key: 'activities', label: 'Activities' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: '0.3rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: activeTab === t.key ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Date range */}
          <div style={{ display: 'flex', gap: 2, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 2 }}>
            {(['7d', '30d', '90d', '1y'] as const).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                style={{ padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: dateRange === r ? 'rgba(255,255,255,0.15)' : 'transparent', color: dateRange === r ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                {r}
              </button>
            ))}
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <Download size={13} /> Export
          </button>
          <button onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer' }}>
            <LogOut size={13} /> Exit Admin
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem' }}>
              <KpiCard label="Total Users"       value={totalUsers}      icon={<Users size={18} />}    change={24.3} color="#6366f1" sub="+2,641 this month" />
              <KpiCard label="Total Trips"       value={totalTrips}      icon={<Map size={18} />}      change={31.7} color="#8b5cf6" sub="+7,814 this month" />
              <KpiCard label="Public Trips"      value={publicTrips}     icon={<Globe size={18} />}    change={18.2} color="#06b6d4" sub="38.3% of all trips" />
              <KpiCard label="Cities Visited"    value={citiesVisited}   icon={<Compass size={18} />}  change={12.8} color="#10b981" sub="72 countries covered" />
              <KpiCard label="Activities Added"  value={activitiesAdded} icon={<Activity size={18} />} change={42.1} color="#f59e0b" sub="Avg 4.9 per trip" />
            </div>

            {/* Charts row 1: User growth + Trips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <Section title="User Growth" icon={<TrendingUp size={16} />}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={slicedChartData}>
                    <defs>
                      <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="users" name="Users" stroke="#6366f1" strokeWidth={2.5} fill="url(#ugGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </Section>

              <Section title="Trips Created" icon={<Map size={16} />}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={slicedChartData} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="trips" name="Trips" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>

            {/* Charts row 2: Budget + Travel Style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              {/* Budget distribution donut */}
              <Section title="Budget Distribution" icon={<Wallet size={16} />}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={BUDGET_DISTRIBUTION} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                      {BUDGET_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {BUDGET_DISTRIBUTION.map(b => (
                    <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: b.color, display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{b.name}</span>
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{b.value}%</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Travel Style */}
              <Section title="Travel Style Split" icon={<BarChart2 size={16} />}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={TRAVEL_STYLES} cx="50%" cy="50%" outerRadius={72} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                      {TRAVEL_STYLES.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color-light)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                  {TRAVEL_STYLES.map(s => (
                    <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: s.color }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color, display: 'inline-block' }} />{s.name} {s.value}%
                    </span>
                  ))}
                </div>
              </Section>

              {/* System Health */}
              <Section title="System Health" icon={<Zap size={16} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'API Uptime',       val: 99.97, color: '#10b981' },
                    { label: 'DB Response',       val: 98.4,  color: '#10b981' },
                    { label: 'CDN Performance',   val: 100,   color: '#10b981' },
                    { label: 'Error Rate',        val: 0.14,  color: '#10b981', invert: true },
                  ].map(h => (
                    <div key={h.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: 5 }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{h.label}</span>
                        <span style={{ fontWeight: 800, color: h.color }}>{h.invert ? h.val + '%' : h.val + '%'}</span>
                      </div>
                      <div style={{ height: 5, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${h.invert ? 100 - h.val * 10 : h.val}%`, backgroundColor: h.color, borderRadius: 'var(--radius-full)' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 4, padding: '0.6rem 0.85rem', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                    <CheckCircle2 size={13} /> All systems operational
                  </div>
                </div>
              </Section>
            </div>

          </div>
        )}

        {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users, email, country…"
                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 3 }}>
                {(['all', 'active', 'suspended', 'new'] as const).map(s => (
                  <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                    style={{ padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', backgroundColor: statusFilter === s ? 'var(--color-primary)' : 'transparent', color: statusFilter === s ? '#fff' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {s}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600 }}>{filtered.length} users found</div>
            </div>

            {/* Table */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color-light)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <ColHeader label="User"    k="name"        />
                      <ColHeader label="Email"   k="email"       />
                      <ColHeader label="Country" k="country"     />
                      <ColHeader label="Trips"   k="trips"       align="center" />
                      <ColHeader label="Spend"   k="totalSpend"  align="right" />
                      <ColHeader label="Joined"  k="joined"      />
                      <ColHeader label="Status"  k="status"      />
                      <th style={{ padding: '0.75rem 0.9rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color-light)', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((u, idx) => (
                      <tr key={u.id}
                        style={{ borderBottom: '1px solid var(--border-color-light)', transition: 'background-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td style={{ padding: '0.8rem 0.9rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar initials={u.avatar} color={AVATAR_COLORS[(page - 1) * PAGE_SIZE + idx % AVATAR_COLORS.length]} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem 0.9rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '0.8rem 0.9rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.country}</td>
                        <td style={{ padding: '0.8rem 0.9rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>{u.trips}</td>
                        <td style={{ padding: '0.8rem 0.9rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>₹{u.totalSpend.toLocaleString()}</td>
                        <td style={{ padding: '0.8rem 0.9rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                          {new Date(u.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td style={{ padding: '0.8rem 0.9rem' }}><StatusBadge status={u.status} /></td>
                        <td style={{ padding: '0.8rem 0.9rem' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button title="View" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Eye size={13} />
                            </button>
                            <button onClick={() => handleSuspend(u.id)} title={u.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                              style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${u.status === 'suspended' ? '#10b98140' : '#f59e0b40'}`, backgroundColor: u.status === 'suspended' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', color: u.status === 'suspended' ? '#10b981' : '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <UserX size={13} />
                            </button>
                            <button onClick={() => setConfirm(u.id)} title="Delete"
                              style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr><td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No users match your filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color-light)' }}>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ChevronLeft size={15} />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i} onClick={() => setPage(i + 1)}
                        style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${page === i + 1 ? 'var(--color-primary)' : 'var(--border-color)'}`, backgroundColor: page === i + 1 ? 'var(--color-primary)' : 'transparent', color: page === i + 1 ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DESTINATIONS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'destinations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Horizontal bar chart */}
              <Section title="Most Planned Destinations" icon={<Compass size={16} />}>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={popularCities.slice(0, 8)} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="city" width={130} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="trips" name="Trips" radius={[0, 4, 4, 0]}>
                      {popularCities.slice(0, 8).map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              {/* Ranked table */}
              <Section title="Destination Rankings" icon={<BarChart2 size={16} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {popularCities.map((d, i) => (
                    <div key={d.city} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: i === 0 ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: i < 3 ? d.color + '22' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, color: i < 3 ? d.color : 'var(--text-muted)', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{d.city}</div>
                        <div style={{ height: 4, backgroundColor: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${d.pct}%`, backgroundColor: d.color, borderRadius: 4 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', flexShrink: 0 }}>{d.trips.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* ── ACTIVITIES TAB ────────────────────────────────────────────────── */}
        {activeTab === 'activities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <Section title="Most Added Activities" icon={<Activity size={16} />}>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={popularActs} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Times Added" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              <Section title="Activity Rankings" icon={<BarChart2 size={16} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {POPULAR_ACTIVITIES.map((a, i) => (
                    <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: i < 3 ? 'rgba(16,185,129,0.15)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 900, color: i < 3 ? '#10b981' : 'var(--text-muted)', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(6,182,212,0.1)', color: '#06b6d4', padding: '1px 6px', borderRadius: 4 }}>{a.category}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', flexShrink: 0 }}>{a.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}

      </div>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────────── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(11,19,41,0.8)', backdropFilter: 'blur(8px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setConfirm(null)}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: 380, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <AlertTriangle size={24} color="#ef4444" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontWeight: 800 }}>Delete User?</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This will permanently remove <strong>{users.find(u => u.id === confirmDelete)?.name}</strong> and all their data. This cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
