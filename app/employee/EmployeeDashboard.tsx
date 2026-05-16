"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const COLORS = ["#7c6aff","#22c55e","#f59e0b","#3b82f6","#ef4444","#ec4899","#14b8a6","#f97316"];
const THRUST_AREAS = ["Sales & Revenue","Customer Success","Operations","People & Culture","Technology","Finance","Safety & Compliance","Strategy"];
const UOM_TYPES = [
  { value: "MIN_NUMERIC", label: "Numeric (Min) — Higher is better", ex: "Sales, Revenue" },
  { value: "MAX_NUMERIC", label: "Numeric (Max) — Lower is better", ex: "TAT, Cost" },
  { value: "TIMELINE", label: "Timeline — Date-based completion", ex: "Project delivery" },
  { value: "ZERO_BASED", label: "Zero-based — Zero = Success", ex: "Safety incidents" },
];

function fmtNum(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n;
}

function computeScore(uomType: string, target: number, actual: number) {
  if (uomType === "ZERO_BASED") return actual === 0 ? 100 : 0;
  if (uomType === "MIN_NUMERIC") return Math.min(100, Math.round((actual / target) * 100));
  if (uomType === "MAX_NUMERIC") return Math.min(100, Math.round((target / actual) * 100));
  return 0;
}

export default function EmployeeDashboard({ user }: { user: any }) {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState("dashboard");
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({
    thrustArea: "", title: "", description: "",
    uomType: "", target: "", weightage: "",
  });

  const cycleYear = new Date().getFullYear();

  useEffect(() => { fetchGoals(); }, []);

  async function fetchGoals() {
    setLoading(true);
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data.goals || []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
  const canAdd = goals.length < 8 && goals.every(g => g.status === "DRAFT");
  const isLocked = goals.some(g => g.status === "APPROVED");
  const canSubmit = totalWeight === 100 && goals.every(g => g.weightage >= 10) && goals.length > 0 && !isLocked;

  function openAdd() {
    setForm({ thrustArea: "", title: "", description: "", uomType: "", target: "", weightage: "" });
    setEditGoal(null);
    setShowModal(true);
  }

  function openEdit(g: any) {
    setForm({
      thrustArea: g.thrustArea, title: g.title, description: g.description || "",
      uomType: g.uomType, target: String(g.target || g.targetDate || ""), weightage: String(g.weightage),
    });
    setEditGoal(g);
    setShowModal(true);
  }

  async function saveGoal() {
    const method = editGoal ? "PATCH" : "POST";
    const url = editGoal ? `/api/goals/${editGoal.id}` : "/api/goals";
    const body = {
      thrustArea: form.thrustArea, title: form.title, description: form.description,
      uomType: form.uomType, weightage: Number(form.weightage), cycleYear,
      ...(form.uomType === "TIMELINE" ? { targetDate: form.target } : { target: Number(form.target) }),
    };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setShowModal(false);
      fetchGoals();
      showToast(editGoal ? "✅ Goal updated!" : "✅ Goal added!");
    } else {
      const err = await res.json();
      showToast("❌ " + (err.error || "Failed to save goal"));
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    fetchGoals();
    showToast("🗑️ Goal deleted");
  }

  async function submitGoals() {
    const res = await fetch("/api/goals/submit", { method: "POST" });
    if (res.ok) { fetchGoals(); showToast("🚀 Goals submitted for approval!"); }
    else { const e = await res.json(); showToast("❌ " + e.error); }
  }

  const S = {
    app: { display: "flex", minHeight: "100vh", fontFamily: "system-ui,sans-serif", background: "#0a0a0f", color: "#e8e8f0" },
    sidebar: { width: 240, background: "#111118", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" as const, position: "fixed" as const, top: 0, left: 0, bottom: 0, zIndex: 100 },
    main: { marginLeft: 240, flex: 1, display: "flex", flexDirection: "column" as const },
    topbar: { height: 60, borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "#0a0a0f", position: "sticky" as const, top: 0, zIndex: 50 },
    content: { flex: 1, padding: 28, overflowY: "auto" as const },
  };

  const navItems = [
    { key: "dashboard", icon: "🏠", label: "Dashboard" },
    { key: "goals", icon: "📋", label: "My Goals" },
    { key: "checkin", icon: "✏️", label: "Check-in" },
  ];

  function renderContent() {
    if (activeKey === "dashboard") return <DashboardView goals={goals} loading={loading} />;
    if (activeKey === "goals") return (
      <GoalsView
        goals={goals} loading={loading} canAdd={canAdd} isLocked={isLocked}
        canSubmit={canSubmit} totalWeight={totalWeight}
        onAdd={openAdd} onEdit={openEdit} onDelete={deleteGoal} onSubmit={submitGoals}
      />
    );
    if (activeKey === "checkin") return <CheckinView goals={goals} onRefresh={fetchGoals} showToast={showToast} />;
    return null;
  }

  return (
    <div style={S.app}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#7c6aff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎯</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e8f0" }}>GoalPort</div>
              <div style={{ fontSize: 11, color: "#5a5a72" }}>FY {cycleYear}</div>
            </div>
          </div>
        </div>

        <div style={{ margin: "12px", padding: "10px 12px", background: "rgba(124,106,255,0.1)", border: "1px solid rgba(124,106,255,0.2)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#a594ff", fontWeight: 600 }}>Employee</div>
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
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
            width: "100%", padding: "9px 10px", borderRadius: 8, background: "transparent",
            border: "none", color: "#9898b0", cursor: "pointer", fontSize: 13, textAlign: "left",
          }}>🚪 Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <div style={S.topbar}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {navItems.find(n => n.key === activeKey)?.label}
          </div>
          <div style={{ fontSize: 13, color: "#9898b0" }}>{user.email}</div>
        </div>
        <div style={S.content}>{renderContent()}</div>
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "22px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>{editGoal ? "Edit Goal" : "Add New Goal"}</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#9898b0", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              {[
                { label: "Thrust Area", key: "thrustArea", type: "select", options: THRUST_AREAS },
                { label: "Goal Title", key: "title", type: "text", placeholder: "e.g. Achieve Sales Revenue Target" },
                { label: "Description", key: "description", type: "textarea", placeholder: "How will this goal be achieved?" },
                { label: "Unit of Measurement", key: "uomType", type: "select", options: UOM_TYPES.map(u => u.value), labels: UOM_TYPES.map(u => u.label) },
                { label: form.uomType === "TIMELINE" ? "Target Date" : "Target Value", key: "target", type: form.uomType === "TIMELINE" ? "date" : "number", placeholder: "e.g. 5000000" },
                { label: "Weightage (%)", key: "weightage", type: "number", placeholder: "Min 10%" },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9898b0", marginBottom: 6 }}>{field.label}</label>
                  {field.type === "select" ? (
                    <select value={(form as any)[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 13 }}>
                      <option value="">Select…</option>
                      {(field.options || []).map((o, i) => <option key={o} value={o}>{field.labels ? field.labels[i] : o}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea value={(form as any)[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder} rows={3}
                      style={{ width: "100%", padding: "10px 14px", background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 13, resize: "vertical" }} />
                  ) : (
                    <input type={field.type} value={(form as any)[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ width: "100%", padding: "10px 14px", background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 13 }} />
                  )}
                </div>
              ))}
              {form.weightage && Number(form.weightage) < 10 && (
                <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>⚠ Minimum weightage is 10%</div>
              )}
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "#9898b0", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={saveGoal} style={{ padding: "9px 16px", borderRadius: 8, background: "#7c6aff", border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save Goal</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#e8e8f0", zIndex: 999, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function DashboardView({ goals, loading }: { goals: any[], loading: boolean }) {
  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
  const approved = goals.filter(g => g.status === "APPROVED").length;
  const submitted = goals.filter(g => g.status === "SUBMITTED").length;

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #111118 0%, rgba(124,106,255,0.08) 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 32px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#5a5a72", marginBottom: 4 }}>Welcome back 👋</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Your Goal Dashboard</div>
        <div style={{ fontSize: 13, color: "#9898b0" }}>FY {new Date().getFullYear()} · Track your goals and performance</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Goals", value: goals.length, sub: "of 8 max", color: "#7c6aff" },
          { label: "Approved", value: approved, sub: "by manager", color: "#22c55e" },
          { label: "Submitted", value: submitted, sub: "awaiting approval", color: "#f59e0b" },
          { label: "Weightage", value: totalWeight + "%", sub: totalWeight === 100 ? "✓ Balanced" : "⚠ Adjust needed", color: totalWeight === 100 ? "#22c55e" : "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px", borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: "#5a5a72", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#e8e8f0", lineHeight: 1 }}>{loading ? "…" : s.value}</div>
            <div style={{ fontSize: 12, color: s.label === "Weightage" ? s.color : "#9898b0", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Check-in Timeline</div>
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { label: "Goal Setting", done: true },
            { label: "Q1", done: false, active: false },
            { label: "Q2", done: false, active: true },
            { label: "Q3", done: false },
            { label: "Q4", done: false },
          ].map((s, i, arr) => (
            <div key={i} style={{ flex: 1, position: "relative", textAlign: "center" }}>
              {i < arr.length - 1 && <div style={{ position: "absolute", top: 14, left: "50%", right: "-50%", height: 2, background: s.done ? "#22c55e" : "rgba(255,255,255,0.07)" }} />}
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${s.done ? "#22c55e" : s.active ? "#7c6aff" : "rgba(255,255,255,0.12)"}`, background: s.done ? "rgba(34,197,94,0.1)" : s.active ? "rgba(124,106,255,0.1)" : "#16161f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: s.done ? "#22c55e" : s.active ? "#7c6aff" : "#5a5a72", margin: "0 auto 8px", position: "relative", zIndex: 1 }}>
                {s.done ? "✓" : s.active ? "●" : "○"}
              </div>
              <div style={{ fontSize: 11, color: s.done ? "#22c55e" : s.active ? "#a594ff" : "#5a5a72" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalsView({ goals, loading, canAdd, isLocked, canSubmit, totalWeight, onAdd, onEdit, onDelete, onSubmit }: any) {
  const remaining = 100 - totalWeight;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>My Goals — FY {new Date().getFullYear()}</div>
          <div style={{ fontSize: 13, color: "#9898b0", marginTop: 4 }}>
            {isLocked ? "✓ Approved & Locked" : "Goal Setting Window Open"}
          </div>
        </div>
        {!isLocked && (
          <div style={{ display: "flex", gap: 10 }}>
            {canAdd && <button onClick={onAdd} style={{ padding: "9px 16px", borderRadius: 8, background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.12)", color: "#e8e8f0", cursor: "pointer", fontSize: 13 }}>+ Add Goal</button>}
            <button onClick={onSubmit} disabled={!canSubmit} style={{ padding: "9px 16px", borderRadius: 8, background: canSubmit ? "#7c6aff" : "#333", border: "none", color: "white", cursor: canSubmit ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600, opacity: canSubmit ? 1 : 0.5 }}>
              Submit for Approval →
            </button>
          </div>
        )}
      </div>

      {/* Validation bar */}
      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 20 }}>
            <span style={{ fontSize: 13 }}>Goals: <strong style={{ color: goals.length <= 8 ? "#e8e8f0" : "#ef4444" }}>{goals.length}/8</strong></span>
            <span style={{ fontSize: 13 }}>Weightage: <strong style={{ color: totalWeight === 100 ? "#22c55e" : totalWeight > 100 ? "#ef4444" : "#f59e0b" }}>{totalWeight}%</strong>
              <span style={{ fontSize: 11, color: "#5a5a72", marginLeft: 6 }}>
                {totalWeight < 100 ? `(${remaining}% remaining)` : totalWeight > 100 ? `(${totalWeight - 100}% over)` : "✓ balanced"}
              </span>
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#5a5a72" }}>Min 10% · Max 8 goals · Total = 100%</span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "#16161f", overflow: "hidden", display: "flex" }}>
          {goals.map((g: any, i: number) => (
            <div key={g.id} style={{ height: "100%", width: g.weightage + "%", background: COLORS[i % COLORS.length], transition: "width 0.3s" }} />
          ))}
          {remaining > 0 && <div style={{ height: "100%", width: remaining + "%", background: "rgba(255,255,255,0.05)" }} />}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#5a5a72" }}>Loading goals…</div>
      ) : goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📋</div>
          <div style={{ fontWeight: 600, fontSize: 16, color: "#9898b0" }}>No goals yet</div>
          <div style={{ fontSize: 13, color: "#5a5a72", marginTop: 6 }}>Click "Add Goal" to start building your goal sheet</div>
          <button onClick={onAdd} style={{ marginTop: 20, padding: "10px 20px", borderRadius: 8, background: "#7c6aff", border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add First Goal</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {goals.map((g: any, i: number) => (
            <div key={g.id} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 22px", borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#5a5a72", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Goal {i + 1} · {g.thrustArea}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{g.title}</div>
                  {g.description && <div style={{ fontSize: 12, color: "#9898b0", marginBottom: 10 }}>{g.description}</div>}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, background: "#1e1e2e", padding: "3px 8px", borderRadius: 6, color: "#9898b0" }}>⚖️ {g.weightage}%</span>
                    <span style={{ fontSize: 11, background: "#1e1e2e", padding: "3px 8px", borderRadius: 6, color: "#9898b0" }}>📏 {g.uomType.replace("_", " ")}</span>
                    <span style={{ fontSize: 11, background: "#1e1e2e", padding: "3px 8px", borderRadius: 6, color: "#9898b0" }}>🎯 {g.target || g.targetDate}</span>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: g.status === "APPROVED" ? "rgba(34,197,94,0.1)" : g.status === "SUBMITTED" ? "rgba(245,158,11,0.1)" : "rgba(124,106,255,0.1)", color: g.status === "APPROVED" ? "#22c55e" : g.status === "SUBMITTED" ? "#f59e0b" : "#a594ff" }}>
                      {g.status === "APPROVED" ? "✓ Approved" : g.status === "SUBMITTED" ? "⏳ Submitted" : g.status === "REWORK_REQUESTED" ? "↩ Rework" : "○ Draft"}
                    </span>
                  </div>
                </div>
                {!isLocked && g.status === "DRAFT" && (
                  <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                    <button onClick={() => onEdit(g)} style={{ padding: "6px 12px", borderRadius: 8, background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.12)", color: "#e8e8f0", cursor: "pointer", fontSize: 12 }}>Edit</button>
                    <button onClick={() => onDelete(g.id)} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckinView({ goals, onRefresh, showToast }: any) {
  const [actuals, setActuals] = useState<any>({});
  const [statuses, setStatuses] = useState<any>({});
  const approvedGoals = goals.filter((g: any) => g.status === "APPROVED");

  async function saveCheckin(goalId: string) {
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId, period: "Q2",
        actual: Number(actuals[goalId]),
        status: statuses[goalId] || "ON_TRACK",
      }),
    });
    if (res.ok) { showToast("💾 Q2 check-in saved!"); onRefresh(); }
    else showToast("❌ Failed to save check-in");
  }

  if (approvedGoals.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>✏️</div>
        <div style={{ fontWeight: 600, color: "#9898b0" }}>No approved goals yet</div>
        <div style={{ fontSize: 13, color: "#5a5a72", marginTop: 6 }}>Goals need to be approved by your manager before check-in</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Q2 Check-in</div>
      <div style={{ fontSize: 13, color: "#9898b0", marginBottom: 24 }}>Log your actual achievement for each goal</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {approvedGoals.map((g: any) => {
          const actual = actuals[g.id] ?? "";
          const score = actual && g.target ? computeScore(g.uomType, g.target, Number(actual)) : null;
          return (
            <div key={g.id} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: "#9898b0", marginTop: 2 }}>{g.thrustArea} · ⚖️ {g.weightage}%</div>
                </div>
                {score !== null && (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, border: `2px solid ${score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444"}`, color: score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444", background: score >= 80 ? "rgba(34,197,94,0.1)" : score >= 50 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)" }}>
                    {score}%
                  </div>
                )}
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#5a5a72", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Planned Target</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{g.target || g.targetDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#5a5a72", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Actual Achievement</div>
                    <input type={g.uomType === "TIMELINE" ? "date" : "number"} value={actual}
                      onChange={e => setActuals({ ...actuals, [g.id]: e.target.value })}
                      placeholder="Enter actual…"
                      style={{ width: "100%", padding: "8px 12px", background: "#16161f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 14, fontWeight: 600 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["NOT_STARTED", "ON_TRACK", "COMPLETED"].map(s => (
                      <button key={s} onClick={() => setStatuses({ ...statuses, [g.id]: s })}
                        style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "none", fontWeight: statuses[g.id] === s ? 600 : 400, background: statuses[g.id] === s ? "#7c6aff" : "#1e1e2e", color: statuses[g.id] === s ? "white" : "#9898b0" }}>
                        {s === "NOT_STARTED" ? "○ Not Started" : s === "ON_TRACK" ? "● On Track" : "✓ Completed"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => saveCheckin(g.id)} style={{ padding: "8px 16px", borderRadius: 8, background: "#7c6aff", border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    Save Q2 Update
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}