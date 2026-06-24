"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, LogIn, Shield, Download, RefreshCw, Mail,
  Globe, KeyRound, TrendingUp, Zap, Flame, Activity,
  Search, ChevronDown, ChevronUp, Eye, EyeOff
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const ADMIN_SECRET_KEY = "aera_admin_secret";

// ── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string; email: string; role: string; created_at: string;
  signup_method: string; total_logins: number; last_login: string | null;
  display_name: string | null; korean_name: string | null; native_language: string | null;
  korean_proficiency: string | null; study_reason: string | null; occupation: string | null;
  gender: string | null; dob: string | null; total_xp: number; current_streak: number;
  level_progress: number; last_active: string | null;
}

interface LoginEvent {
  id: string; user_id: string; email: string; event_type: string;
  method: string; ip_address: string; user_agent: string; timestamp: string;
}

interface Stats {
  total_users: number; total_login_events: number;
  google_signups: number; password_signups: number;
}

// ── Helper ───────────────────────────────────────────────────────────────────
function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function MethodBadge({ method }: { method: string }) {
  const isGoogle = method === "google";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
      isGoogle
        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }`}>
      {isGoogle ? <Globe className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
      {isGoogle ? "Google" : "Password"}
    </span>
  );
}

function EventBadge({ type }: { type: string }) {
  const isSignup = type === "signup";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
      isSignup
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
    }`}>
      {isSignup ? "🎉 Signup" : "🔐 Login"}
    </span>
  );
}

// ── Login Screen ─────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (secret: string) => void }) {
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) { setError("Please enter the admin secret."); return; }
    onLogin(secret.trim());
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="w-full max-w-sm bg-zinc-900/80 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-black text-white">애라.ai Admin</h1>
          <p className="text-xs text-zinc-500 text-center">Enter the admin secret to access the management dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={secret}
              onChange={e => { setSecret(e.target.value); setError(""); }}
              placeholder="Admin secret key..."
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 pr-12 font-mono"
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition cursor-pointer">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
          <button type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl font-black transition shadow-lg shadow-purple-500/20 cursor-pointer">
            Access Dashboard →
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "events">("users");

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof User>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Restore secret from session
  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_SECRET_KEY);
    if (saved) setAdminSecret(saved);
  }, []);

  const apiFetch = useCallback(async (path: string, secret: string) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "X-Admin-Secret": secret }
    });
    if (res.status === 403) { setAuthError(true); return null; }
    if (!res.ok) throw new Error(`${res.status} — ${res.statusText}`);
    return res.json();
  }, []);

  const loadData = useCallback(async (secret: string) => {
    setLoading(true);
    setAuthError(false);
    setLoadError(null);
    try {
      const [statsData, usersData, eventsData] = await Promise.all([
        apiFetch("/admin/stats", secret),
        apiFetch("/admin/users?limit=200", secret),
        apiFetch("/admin/login-events?limit=200", secret),
      ]);
      if (statsData) setStats(statsData);
      if (usersData) { setUsers(usersData.users); setTotalUsers(usersData.total); }
      if (eventsData) { setEvents(eventsData.events); setTotalEvents(eventsData.total); }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setLoadError(`Backend unreachable: ${msg}`);
      console.error("Admin load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);


  const handleLogin = (secret: string) => {
    sessionStorage.setItem(ADMIN_SECRET_KEY, secret);
    setAdminSecret(secret);
    loadData(secret);
  };

  useEffect(() => {
    if (adminSecret) loadData(adminSecret);
  }, [adminSecret, loadData]);

  if (!adminSecret) return <AdminLogin onLogin={handleLogin} />;
  if (authError) {
    sessionStorage.removeItem(ADMIN_SECRET_KEY);
    return <AdminLogin onLogin={handleLogin} />;
  }

  // ── Filtering & Sorting for Users ─────────────────────────────────────────
  const filteredUsers = users
    .filter(u => {
      const q = search.toLowerCase();
      const matchesSearch = !q || u.email.toLowerCase().includes(q) ||
        (u.display_name || "").toLowerCase().includes(q) ||
        (u.korean_name || "").toLowerCase().includes(q);
      const matchesMethod = !methodFilter || u.signup_method === methodFilter;
      return matchesSearch && matchesMethod;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const filteredEvents = events.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = !q || e.email.toLowerCase().includes(q);
    const matchesMethod = !methodFilter || e.method === methodFilter;
    const matchesType = !eventTypeFilter || e.event_type === eventTypeFilter;
    return matchesSearch && matchesMethod && matchesType;
  });

  const handleSort = (key: keyof User) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: keyof User }) =>
    sortKey === k
      ? sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
      : null;

  const handleCsvExport = () => {
    if (!adminSecret) return;
    window.open(`${API_BASE}/admin/export/users.csv`, "_blank");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/4 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/4 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-black text-lg text-white leading-none">애라.ai Admin</h1>
            <p className="text-[10px] text-zinc-500 font-mono">Management Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => adminSecret && loadData(adminSecret)} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={handleCsvExport}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400 transition cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => { sessionStorage.removeItem(ADMIN_SECRET_KEY); setAdminSecret(null); }}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold text-red-400 transition cursor-pointer">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

        {/* ── Stats Cards ─────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", val: stats.total_users, icon: <Users className="w-5 h-5 text-blue-400" />, color: "border-blue-500/20 bg-blue-500/5" },
              { label: "Total Login Events", val: stats.total_login_events, icon: <Activity className="w-5 h-5 text-purple-400" />, color: "border-purple-500/20 bg-purple-500/5" },
              { label: "Google Signups", val: stats.google_signups, icon: <Globe className="w-5 h-5 text-blue-300" />, color: "border-sky-500/20 bg-sky-500/5" },
              { label: "Password Signups", val: stats.password_signups, icon: <KeyRound className="w-5 h-5 text-amber-400" />, color: "border-amber-500/20 bg-amber-500/5" },
            ].map(c => (
              <div key={c.label} className={`rounded-2xl border p-5 ${c.color} flex items-center gap-4`}>
                <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-white/5">{c.icon}</div>
                <div>
                  <div className="text-2xl font-black text-white">{c.val.toLocaleString()}</div>
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── API URL Debug Banner ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-900/60 border border-white/5 rounded-2xl text-xs font-mono text-zinc-600">
          <span className="text-zinc-500">API →</span>
          <span className="text-zinc-400">{API_BASE}</span>
        </div>

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {loadError && (
          <div className="flex items-center gap-3 px-5 py-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm">
            <span className="text-red-400 font-black">⚠ Error:</span>
            <span className="text-red-300">{loadError}</span>
            <span className="text-zinc-500 ml-auto text-xs">
              Set <code className="bg-zinc-800 px-1 rounded">NEXT_PUBLIC_API_URL</code> on Render frontend if this is wrong
            </span>
          </div>
        )}

        {/* ── Email Alert Notice ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-sm">
          <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-zinc-300">
            Email alerts are <strong className="text-emerald-400">active</strong> — every login and signup triggers a notification to{" "}
            <strong className="text-white">sambitmaths123@gmail.com</strong>
          </span>
        </div>

        {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
        <div className="flex gap-2 bg-zinc-900/60 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: "users" as const, label: "All Users", icon: <Users className="w-4 h-4" />, count: totalUsers },
            { id: "events" as const, label: "Login Events", icon: <LogIn className="w-4 h-4" />, count: totalEvents },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}>
              {tab.icon} {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === tab.id ? "bg-white/20" : "bg-zinc-800"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── Search & Filters ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition" />
          </div>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
            className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:outline-none cursor-pointer">
            <option value="">All Methods</option>
            <option value="google">Google</option>
            <option value="password">Password</option>
          </select>
          {activeTab === "events" && (
            <select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:outline-none cursor-pointer">
              <option value="">All Events</option>
              <option value="signup">Signups</option>
              <option value="login">Logins</option>
            </select>
          )}
          {(search || methodFilter || eventTypeFilter) && (
            <button onClick={() => { setSearch(""); setMethodFilter(""); setEventTypeFilter(""); }}
              className="text-xs text-zinc-500 hover:text-white transition cursor-pointer underline">
              Clear filters
            </button>
          )}
        </div>

        {/* ── Users Table ─────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-zinc-950/60">
                    {[
                      { label: "User", key: "email" as keyof User },
                      { label: "Method", key: "signup_method" as keyof User },
                      { label: "Joined", key: "created_at" as keyof User },
                      { label: "Last Login", key: "last_login" as keyof User },
                      { label: "Logins", key: "total_logins" as keyof User },
                      { label: "XP", key: "total_xp" as keyof User },
                      { label: "Streak", key: "current_streak" as keyof User },
                      { label: "Proficiency", key: "korean_proficiency" as keyof User },
                    ].map(col => (
                      <th key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider cursor-pointer hover:text-white transition select-none whitespace-nowrap">
                        <span className="flex items-center gap-1">{col.label}<SortIcon k={col.key} /></span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-600 text-sm">No users found</td></tr>
                  ) : filteredUsers.map((u, i) => (
                    <>
                      <tr key={u.id}
                        className={`border-b border-white/5 hover:bg-white/2 transition ${i % 2 === 0 ? "bg-transparent" : "bg-zinc-950/20"}`}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-white text-xs">{u.display_name || u.email.split("@")[0]}</div>
                          <div className="text-zinc-500 text-[10px] font-mono">{u.email}</div>
                          {u.korean_name && <div className="text-amber-400 text-[10px] font-korean">{u.korean_name}</div>}
                        </td>
                        <td className="px-4 py-3"><MethodBadge method={u.signup_method} /></td>
                        <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{fmt(u.created_at)}</td>
                        <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{fmt(u.last_login)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <LogIn className="w-3.5 h-3.5 text-purple-400" />
                            <span className="font-black text-white">{u.total_logins}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-white">{u.total_xp?.toLocaleString() ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className="font-bold text-white">{u.current_streak}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 max-w-[140px] truncate">
                          {u.korean_proficiency?.split(" (")[0] || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setExpandedRow(expandedRow === u.id ? null : u.id)}
                            className="text-xs text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer">
                            {expandedRow === u.id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === u.id && (
                        <tr key={`${u.id}-exp`} className="bg-purple-500/3 border-b border-purple-500/10">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              {[
                                { label: "User ID", val: u.id },
                                { label: "Gender", val: u.gender },
                                { label: "Date of Birth", val: u.dob },
                                { label: "Native Language", val: u.native_language },
                                { label: "Occupation", val: u.occupation },
                                { label: "Study Reason", val: u.study_reason },
                                { label: "Last Active", val: fmt(u.last_active) },
                                { label: "Level Progress", val: u.level_progress },
                              ].map(item => (
                                <div key={item.label} className="bg-zinc-950/60 rounded-xl p-3 border border-white/5">
                                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider font-black mb-1">{item.label}</div>
                                  <div className="text-zinc-300 font-semibold truncate">{item.val || "—"}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/5 text-[11px] text-zinc-600 font-mono">
              Showing {filteredUsers.length} of {totalUsers} users
            </div>
          </div>
        )}

        {/* ── Login Events Table ───────────────────────────────────────────── */}
        {activeTab === "events" && (
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-zinc-950/60">
                    {["Timestamp", "Email", "Event", "Method", "IP Address", "User Agent"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] text-zinc-500 font-black uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-600 text-sm">No events found</td></tr>
                  ) : filteredEvents.map((e, i) => (
                    <tr key={e.id} className={`border-b border-white/5 hover:bg-white/2 transition ${i % 2 === 0 ? "" : "bg-zinc-950/20"}`}>
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap font-mono">{fmt(e.timestamp)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-blue-400">{e.email}</td>
                      <td className="px-4 py-3"><EventBadge type={e.event_type} /></td>
                      <td className="px-4 py-3"><MethodBadge method={e.method} /></td>
                      <td className="px-4 py-3 text-xs text-zinc-500 font-mono">{e.ip_address || "—"}</td>
                      <td className="px-4 py-3 text-xs text-zinc-600 max-w-[200px] truncate" title={e.user_agent}>{e.user_agent || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/5 text-[11px] text-zinc-600 font-mono">
              Showing {filteredEvents.length} of {totalEvents} events
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
