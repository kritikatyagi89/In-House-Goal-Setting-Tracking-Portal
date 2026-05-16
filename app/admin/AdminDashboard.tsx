"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

const THRUST_AREAS = ["Sales & Revenue","Customer Success","Operations","People & Culture","Technology","Finance","Safety & Compliance","Strategy"];
const UOM_TYPES = [
  { value: "MIN_NUMERIC", label: "Numeric (Min) — Higher is better" },
  { value: "MAX_NUMERIC", label: "Numeric (Max) — Lower is better" },
  { value: "TIMELINE", label: "Timeline — Date-based completion" },
  { value: "ZERO_BASED", label: "Zero-based — Zero = Success" },
];

export default function AdminDashboard({ user }: { user: any }) {
  const [activeKey, setActiveKey] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showSharedModal, setShowSharedModal] = useState(false);
  const [sharedForm, setSharedForm] = useState({
    thrustArea: "", title: "", description: "",
    uomType: "", target: "", weightage: "",
    recipientIds: [] as string[],
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [statsRes, usersRes, goalsRes, auditRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/admin/users"),
      fetch("/api/admin/goals"),
      fetch("/api/admin/audit"),
    ]);
    const [statsData, usersData, goalsData, auditData] = await Promise.all([
      statsRes.json(), usersRes.json(), goalsRes.json(), auditRes.json(),
    ]);
    setStats(statsData);
    setAllUsers(usersData.users || []);
    setAllGoals(goalsData.goals || []);
    setAuditLogs(auditData.logs || []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function pushSharedGoal() {
    if (!sharedForm.recipientIds.length) { showToast("❌ Select at least one employee"); return; }
    const res = await fetch("/api/admin/shared-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sharedForm, cycleYear: new Date().getFullYear() }),
    });
    if (res.ok) {
      showToast("🚀 Shared goal pushed to employees!");
      setShowSharedModal(false);
      setSharedForm({ thrustArea: "", title: "", description: "", uomType: "", target: "", weightage: "", recipientIds: [] });
      fetchAll();
    } else {
      const e = await res.json();
      showToast("❌ " + e.error);
    }
  }

  async function exportReport() {
    const res = await fetch("/api/admin/export");
    const data = await res.json();
    const csv = generateCSV(data.report || []);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goal-report-${new Date().getFullYear()}.csv`;
    a.click();
    showToast("📥 Report exported!");
  }

  function generateCSV(rows: any[]) {
    if (!rows.length) return "No data";
    const headers = Object.keys(rows[0]).join(",");
    const body = rows.map(r => Object.values(r).map(v => `"${v}"`).join(",")).join("\n");
    return headers + "\n" + body;
  }

  const employees = allUsers.filter(u => u.role === "EMPLOYEE");
  const navItems = [
    { key: "dashboard", icon: "🏠", label: "Dashboard" },
    { key: "users", icon: "👥", label: "All Users" },
    { key: "goals", icon: "📋", label: "All Goals" },
    { key: "shared", icon: "📡", label: "Shared Goals" },
    { key: "audit", icon: "📜", label: "Audit Trail" },
    { key: "reports", icon: "📊", label: "Reports" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui,sans-serif", background: "#0a0a0f", color: "#e8e8f0" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: "#111118", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e8f0" }}>GoalPort</div>
              <div style={{ fontSize: 11, color: "#5a5a72" }}>Admin / HR</div>
            </div>
          </div>
        </div>

        <div style={{ margin: "12px", padding: "10px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>Admin</div>
          <div style={{ fontSize: 13, color: "#e8e8f0", fontWeight: 500 }}>{user.name}</div>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px" }}>
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveKey(item.key)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
              cursor: "pointer", fontSize: 13.5, color: activeKey === item.key ? "#e8e8f0" : "#9898b0",
              fontWeight: activeKey === item.key ? 500 : 400,
              background: activeKey === item.key ? "#1e1e2e" : "transparent",
              border: "none", width: "100%", textAlign: "left",
            }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, background: "transparent", border: "none", color: "#9898b0", cursor: "pointer", fontSize: 13, textAlign: "left" }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 60, borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "#0a0a0f", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{navItems.find(n => n.key === activeKey)?.label}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={exportReport} style={{ padding: "7px 14px", borderRadius: 8, background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.12)", color: "#e8e8f0", cursor: "pointer", fontSize: 12 }}>📥 Export CSV</button>
            <div style={{ fontSize: 13, color: "#9898b0" }}>{user.email}</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {activeKey === "dashboard" && <DashboardView stats={stats} loading={loading} allGoals={allGoals} onNavigate={setActiveKey} />}
          {activeKey === "users" && <UsersView users={allUsers} loading={loading} />}
          {activeKey === "goals" && <GoalsView goals={allGoals} loading={loading} />}
          {activeKey === "shared" && <SharedView goals={allGoals.filter(g => g.isShared)} onPush={() => setShowSharedModal(true)} loading={loading} />}
          {activeKey === "audit" && <AuditView logs={auditLogs} loading={loading} />}
          {activeKey === "reports" && <ReportsView goals={allGoals} users={allUsers} loading={loading} onExport={exportReport} />}
        </div>
      </main>

      {/* Shared Goal Modal */}
      {showSharedModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "22px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>📡 Push Shared Goal to Employees</span>
              <button onClick={() => setShowSharedModal(false)} style={{ background: "none", border: "none", color: "#9898b0", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              {[
                { label: "Thrust Area", key: "thrustArea", type: "select", options: THRUST_AREAS },
                { label: "Goal Title", key: "title", type: "text", placeholder: "e.g. Achieve Q2 Revenue Target" },
                { label: "Description", key: "description", type: "textarea", placeholder: "Goal details…" },
                { label: "Unit of Measurement", key: "uomType", type: "select", options: UOM_TYPES.map(u => u.value), labels: UOM_TYPES.map(u => u.label) },
                { label: "Target Value", key: "target", type: "number", placeholder: "e.g. 5000000" },
                { label: "Weightage (%) per employee", key: "weightage", type: "number", placeholder: "e.g. 20" },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9898b0", marginBottom: 6 }}>{field.label}</label>
                  {field.type === "select" ? (
                    <select value={(sharedForm as any)[field.key]} onChange={e => setSharedForm({ ...sharedForm, [field.key]: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 13 }}>
                      <option value="">Select…</option>
                      {(field.options || []).map((o, i) => <option key={o} value={o}>{field.labels ? field.labels[i] : o}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea value={(sharedForm as any)[field.key]} onChange={e => setSharedForm({ ...sharedForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder} rows={3}
                      style={{ width: "100%", padding: "10px 14px", background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 13, resize: "vertical" }} />
                  ) : (
                    <input type={field.type} value={(sharedForm as any)[field.key]} onChange={e => setSharedForm({ ...sharedForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: "100%", padding: "10px 14px", background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 13 }} />
                  )}
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9898b0", marginBottom: 8 }}>Select Employees</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                  {employees.map(emp => (
                    <label key={emp.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#16161f", borderRadius: 8, cursor: "pointer", border: sharedForm.recipientIds.includes(emp.id) ? "1px solid #7c6aff" : "1px solid rgba(255,255,255,0.07)" }}>
                      <input type="checkbox" checked={sharedForm.recipientIds.includes(emp.id)}
                        onChange={e => setSharedForm({ ...sharedForm, recipientIds: e.target.checked ? [...sharedForm.recipientIds, emp.id] : sharedForm.recipientIds.filter(id => id !== emp.id) })} />
                      <span style={{ fontSize: 13 }}>{emp.name}</span>
                      <span style={{ fontSize: 11, color: "#5a5a72", marginLeft: "auto" }}>{emp.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowSharedModal(false)} style={{ padding: "9px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#9898b0", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={pushSharedGoal} style={{ padding: "9px 16px", borderRadius: 8, background: "#ef4444", border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>📡 Push to Employees</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#e8e8f0", zIndex: 999, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function DashboardView({ stats, loading, allGoals, onNavigate }: any) {
  const byStatus = {
    DRAFT: allGoals.filter((g: any) => g.status === "DRAFT").length,
    SUBMITTED: allGoals.filter((g: any) => g.status === "SUBMITTED").length,
    APPROVED: allGoals.filter((g: any) => g.status === "APPROVED").length,
    REWORK_REQUESTED: allGoals.filter((g: any) => g.status === "REWORK_REQUESTED").length,
  };

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #111118 0%, rgba(239,68,68,0.06) 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 32px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#5a5a72", marginBottom: 4 }}>Admin Control Center 🛡️</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Organisation Overview</div>
        <div style={{ fontSize: 13, color: "#9898b0" }}>FY {new Date().getFullYear()} · Full visibility across all employees and goals</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Employees", value: loading ? "…" : stats?.employees ?? 0, color: "#7c6aff" },
          { label: "Total Managers", value: loading ? "…" : stats?.managers ?? 0, color: "#22c55e" },
          { label: "Total Goals", value: loading ? "…" : allGoals.length, color: "#3b82f6" },
          { label: "Approved Goals", value: loading ? "…" : byStatus.APPROVED, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px", borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: "#5a5a72", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#e8e8f0", lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Goal Status Breakdown</div>
          {[
            { label: "Draft", count: byStatus.DRAFT, color: "#a594ff" },
            { label: "Submitted", count: byStatus.SUBMITTED, color: "#f59e0b" },
            { label: "Approved", count: byStatus.APPROVED, color: "#22c55e" },
            { label: "Rework", count: byStatus.REWORK_REQUESTED, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#9898b0" }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.count}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "#16161f" }}>
                <div style={{ height: "100%", borderRadius: 99, background: s.color, width: allGoals.length ? (s.count / allGoals.length * 100) + "%" : "0%" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Quick Actions</div>
          {[
            { label: "Push Shared Goal to Employees", icon: "📡", action: () => onNavigate("shared"), color: "#ef4444" },
            { label: "View All Goals", icon: "📋", action: () => onNavigate("goals"), color: "#7c6aff" },
            { label: "View Audit Trail", icon: "📜", action: () => onNavigate("audit"), color: "#f59e0b" },
            { label: "Generate Report", icon: "📊", action: () => onNavigate("reports"), color: "#22c55e" },
          ].map(a => (
            <button key={a.label} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, background: "#16161f", border: "1px solid rgba(255,255,255,0.07)", color: "#e8e8f0", cursor: "pointer", fontSize: 13, marginBottom: 8, textAlign: "left" }}>
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersView({ users, loading }: any) {
  const [filter, setFilter] = useState("ALL");
  const filtered = filter === "ALL" ? users : users.filter((u: any) => u.role === filter);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["ALL", "EMPLOYEE", "MANAGER", "ADMIN"].map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "none", background: filter === r ? "#7c6aff" : "#1e1e2e", color: filter === r ? "white" : "#9898b0", fontWeight: filter === r ? 600 : 400 }}>{r}</button>
        ))}
      </div>
      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 120px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 11, color: "#5a5a72", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <span>Name</span><span>Email</span><span>Role</span><span>Department</span>
        </div>
        {loading ? <div style={{ padding: 40, textAlign: "center", color: "#5a5a72" }}>Loading…</div> :
          filtered.map((u: any) => (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 120px", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.role === "ADMIN" ? "rgba(239,68,68,0.15)" : u.role === "MANAGER" ? "rgba(34,197,94,0.15)" : "rgba(124,106,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: u.role === "ADMIN" ? "#ef4444" : u.role === "MANAGER" ? "#22c55e" : "#a594ff" }}>
                  {u.name[0]}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</span>
              </div>
              <span style={{ fontSize: 12, color: "#9898b0" }}>{u.email}</span>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: u.role === "ADMIN" ? "rgba(239,68,68,0.1)" : u.role === "MANAGER" ? "rgba(34,197,94,0.1)" : "rgba(124,106,255,0.1)", color: u.role === "ADMIN" ? "#ef4444" : u.role === "MANAGER" ? "#22c55e" : "#a594ff", display: "inline-block" }}>{u.role}</span>
              <span style={{ fontSize: 12, color: "#9898b0" }}>{u.department?.name ?? "—"}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function GoalsView({ goals, loading }: any) {
  const [filter, setFilter] = useState("ALL");
  const filtered = filter === "ALL" ? goals : goals.filter((g: any) => g.status === filter);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REWORK_REQUESTED"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "none", background: filter === s ? "#7c6aff" : "#1e1e2e", color: filter === s ? "white" : "#9898b0", fontWeight: filter === s ? 600 : 400 }}>
            {s === "REWORK_REQUESTED" ? "REWORK" : s}
          </button>
        ))}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#5a5a72" }}>Loading…</div> :
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((g: any) => (
            <div key={g.id} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#5a5a72", marginBottom: 3 }}>{g.owner?.name} · {g.thrustArea}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{g.title}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 11, background: "#1e1e2e", padding: "3px 8px", borderRadius: 6, color: "#9898b0" }}>⚖️ {g.weightage}%</span>
                    <span style={{ fontSize: 11, background: "#1e1e2e", padding: "3px 8px", borderRadius: 6, color: "#9898b0" }}>🎯 {g.target ?? "—"}</span>
                    {g.isShared && <span style={{ fontSize: 11, background: "rgba(239,68,68,0.1)", padding: "3px 8px", borderRadius: 6, color: "#ef4444" }}>📡 Shared</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: g.status === "APPROVED" ? "rgba(34,197,94,0.1)" : g.status === "SUBMITTED" ? "rgba(245,158,11,0.1)" : g.status === "REWORK_REQUESTED" ? "rgba(239,68,68,0.1)" : "rgba(124,106,255,0.1)", color: g.status === "APPROVED" ? "#22c55e" : g.status === "SUBMITTED" ? "#f59e0b" : g.status === "REWORK_REQUESTED" ? "#ef4444" : "#a594ff" }}>
                  {g.status}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#5a5a72" }}>No goals with this status</div>}
        </div>
      }
    </div>
  );
}

function SharedView({ goals, onPush, loading }: any) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Shared Goals</div>
          <div style={{ fontSize: 13, color: "#9898b0", marginTop: 4 }}>Push KPIs to multiple employees at once</div>
        </div>
        <button onClick={onPush} style={{ padding: "9px 16px", borderRadius: 8, background: "#ef4444", border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          📡 Push New Shared Goal
        </button>
      </div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#5a5a72" }}>Loading…</div> :
        goals.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
            <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>📡</div>
            <div style={{ fontWeight: 600, color: "#9898b0" }}>No shared goals yet</div>
            <div style={{ fontSize: 13, color: "#5a5a72", marginTop: 6 }}>Push a shared goal to assign the same KPI to multiple employees</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {goals.map((g: any) => (
              <div key={g.id} style={{ background: "#111118", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{g.title}</div>
                <div style={{ fontSize: 12, color: "#9898b0" }}>{g.thrustArea} · ⚖️ {g.weightage}% · 🎯 {g.target ?? "—"}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function AuditView({ logs, loading }: any) {
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Audit Trail</div>
      <div style={{ fontSize: 13, color: "#9898b0", marginBottom: 24 }}>Complete history of all goal actions</div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#5a5a72" }}>Loading…</div> :
        logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#5a5a72" }}>No audit logs yet</div>
        ) : (
          <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            {logs.map((log: any, i: number) => (
              <div key={log.id} style={{ padding: "14px 20px", borderBottom: i < logs.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e1e2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                  {log.action.includes("APPROVED") ? "✅" : log.action.includes("REWORK") ? "↩" : log.action.includes("EDIT") ? "✏️" : "📝"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{log.action.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 11, color: "#9898b0", marginTop: 2 }}>
                    by {log.user?.name ?? "Unknown"} · {log.goal?.title ?? "Deleted goal"}
                    {log.details && <span style={{ marginLeft: 8, color: "#5a5a72" }}>{log.details}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#5a5a72", flexShrink: 0 }}>
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

function ReportsView({ goals, users, loading, onExport }: any) {
  const employees = users.filter((u: any) => u.role === "EMPLOYEE");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Achievement Reports</div>
          <div style={{ fontSize: 13, color: "#9898b0", marginTop: 4 }}>FY {new Date().getFullYear()} performance summary</div>
        </div>
        <button onClick={onExport} style={{ padding: "9px 16px", borderRadius: 8, background: "#22c55e", border: "none", color: "#0a0a0f", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          📥 Export CSV Report
        </button>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#5a5a72" }}>Loading…</div> :
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {employees.map((emp: any) => {
            const empGoals = goals.filter((g: any) => g.ownerId === emp.id);
            const approved = empGoals.filter((g: any) => g.status === "APPROVED").length;
            const checkins = empGoals.flatMap((g: any) => g.checkIns || []);
            const avgScore = checkins.length ? Math.round(checkins.reduce((s: number, c: any) => s + (c.score || 0), 0) / checkins.length) : null;

            return (
              <div key={emp.id} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(124,106,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#a594ff" }}>{emp.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: "#9898b0" }}>{emp.email}</div>
                    </div>
                  </div>
                  {avgScore !== null && (
                    <div style={{ textAlign: "center", background: avgScore >= 80 ? "rgba(34,197,94,0.1)" : avgScore >= 50 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${avgScore >= 80 ? "rgba(34,197,94,0.3)" : avgScore >= 50 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 12, padding: "10px 16px" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: avgScore >= 80 ? "#22c55e" : avgScore >= 50 ? "#f59e0b" : "#ef4444" }}>{avgScore}%</div>
                      <div style={{ fontSize: 10, color: "#5a5a72" }}>Avg Score</div>
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { label: "Total Goals", value: empGoals.length },
                    { label: "Approved", value: approved },
                    { label: "Check-ins", value: checkins.length },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#16161f", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#5a5a72", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}