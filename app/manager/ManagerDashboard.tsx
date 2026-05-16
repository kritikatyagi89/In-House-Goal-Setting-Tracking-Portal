"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

const COLORS = ["#7c6aff","#22c55e","#f59e0b","#3b82f6","#ef4444","#ec4899","#14b8a6","#f97316"];

export default function ManagerDashboard({ user }: { user: any }) {
  const [activeKey, setActiveKey] = useState("dashboard");
  const [teamGoals, setTeamGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [comments, setComments] = useState<any>({});
  const [editTargets, setEditTargets] = useState<any>({});
  const [showEditModal, setShowEditModal] = useState<string | null>(null);

  useEffect(() => { fetchTeamGoals(); }, []);

  async function fetchTeamGoals() {
    setLoading(true);
    const res = await fetch("/api/manager/goals");
    const data = await res.json();
    setTeamGoals(data.employees || []);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function approveGoal(goalId: string) {
    const res = await fetch(`/api/goals/${goalId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE" }),
    });
    if (res.ok) { showToast("✅ Goal approved!"); fetchTeamGoals(); }
    else showToast("❌ Failed to approve");
  }

  async function approveAll(employeeId: string) {
    const employee = teamGoals.find(e => e.id === employeeId);
    if (!employee) return;
    const submitted = employee.goals.filter((g: any) => g.status === "SUBMITTED");
    for (const g of submitted) {
      await fetch(`/api/goals/${g.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
    }
    showToast(`✅ All goals approved for ${employee.name}!`);
    fetchTeamGoals();
  }

  async function requestRework(goalId: string, comment: string) {
    if (!comment.trim()) { showToast("❌ Please add a comment before requesting rework"); return; }
    const res = await fetch(`/api/goals/${goalId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REWORK", comment }),
    });
    if (res.ok) { showToast("↩ Rework requested"); fetchTeamGoals(); }
    else showToast("❌ Failed");
  }

  async function saveInlineEdit(goalId: string) {
    const edits = editTargets[goalId];
    if (!edits) return;
    const res = await fetch(`/api/goals/${goalId}/manager-edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edits),
    });
    if (res.ok) { showToast("✏️ Goal updated"); setShowEditModal(null); fetchTeamGoals(); }
    else showToast("❌ Failed to update");
  }

  async function addComment(goalId: string, period: string) {
    const comment = comments[goalId];
    if (!comment?.trim()) return;
    const res = await fetch("/api/checkins/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId, period, comment }),
    });
    if (res.ok) { showToast("💬 Comment added"); setComments({ ...comments, [goalId]: "" }); fetchTeamGoals(); }
    else showToast("❌ Failed");
  }

  const navItems = [
    { key: "dashboard", icon: "🏠", label: "Dashboard" },
    { key: "approvals", icon: "✅", label: "Goal Approvals" },
    { key: "checkins", icon: "📊", label: "Check-in Review" },
  ];

  const totalSubmitted = teamGoals.reduce((s, e) => s + e.goals.filter((g: any) => g.status === "SUBMITTED").length, 0);
  const totalApproved = teamGoals.reduce((s, e) => s + e.goals.filter((g: any) => g.status === "APPROVED").length, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui,sans-serif", background: "#0a0a0f", color: "#e8e8f0" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: "#111118", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👔</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e8f0" }}>GoalPort</div>
              <div style={{ fontSize: 11, color: "#5a5a72" }}>Manager View</div>
            </div>
          </div>
        </div>

        <div style={{ margin: "12px", padding: "10px 12px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Manager</div>
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
              {item.key === "approvals" && totalSubmitted > 0 && (
                <span style={{ marginLeft: "auto", background: "#f59e0b", color: "#0a0a0f", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "2px 6px" }}>{totalSubmitted}</span>
              )}
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
          <div style={{ fontSize: 13, color: "#9898b0" }}>{user.email}</div>
        </div>

        <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {activeKey === "dashboard" && <DashboardView teamGoals={teamGoals} loading={loading} totalSubmitted={totalSubmitted} totalApproved={totalApproved} onNavigate={setActiveKey} />}
          {activeKey === "approvals" && (
            <ApprovalsView
              teamGoals={teamGoals} loading={loading}
              expandedEmployee={expandedEmployee} setExpandedEmployee={setExpandedEmployee}
              comments={comments} setComments={setComments}
              editTargets={editTargets} setEditTargets={setEditTargets}
              showEditModal={showEditModal} setShowEditModal={setShowEditModal}
              onApprove={approveGoal} onApproveAll={approveAll}
              onRework={requestRework} onSaveEdit={saveInlineEdit}
            />
          )}
          {activeKey === "checkins" && <CheckinsView teamGoals={teamGoals} loading={loading} comments={comments} setComments={setComments} onComment={addComment} />}
        </div>
      </main>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#e8e8f0", zIndex: 999, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function DashboardView({ teamGoals, loading, totalSubmitted, totalApproved, onNavigate }: any) {
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #111118 0%, rgba(34,197,94,0.06) 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 32px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#5a5a72", marginBottom: 4 }}>Manager Overview 👔</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Team Goal Dashboard</div>
        <div style={{ fontSize: 13, color: "#9898b0" }}>FY {new Date().getFullYear()} · Review and approve your team's goals</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Team Members", value: teamGoals.length, color: "#7c6aff" },
          { label: "Pending Approval", value: totalSubmitted, color: "#f59e0b" },
          { label: "Approved Goals", value: totalApproved, color: "#22c55e" },
          { label: "Total Goals", value: teamGoals.reduce((s: number, e: any) => s + e.goals.length, 0), color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px", borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: "#5a5a72", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#e8e8f0", lineHeight: 1 }}>{loading ? "…" : s.value}</div>
          </div>
        ))}
      </div>

      {totalSubmitted > 0 && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, color: "#f59e0b" }}>⏳ {totalSubmitted} goal{totalSubmitted > 1 ? "s" : ""} awaiting your approval</div>
            <div style={{ fontSize: 12, color: "#9898b0", marginTop: 4 }}>Review and approve your team's submitted goals</div>
          </div>
          <button onClick={() => onNavigate("approvals")} style={{ padding: "9px 16px", borderRadius: 8, background: "#f59e0b", border: "none", color: "#0a0a0f", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            Review Now →
          </button>
        </div>
      )}

      <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: 700, fontSize: 15 }}>Team Overview</div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5a5a72" }}>Loading…</div>
        ) : teamGoals.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#5a5a72" }}>No team members found. Employees need to be assigned to you as their manager.</div>
        ) : (
          teamGoals.map((emp: any) => {
            const submitted = emp.goals.filter((g: any) => g.status === "SUBMITTED").length;
            const approved = emp.goals.filter((g: any) => g.status === "APPROVED").length;
            const totalW = emp.goals.reduce((s: number, g: any) => s + g.weightage, 0);
            return (
              <div key={emp.id} style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(124,106,255,0.15)", border: "1px solid rgba(124,106,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#a594ff" }}>
                    {emp.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.name}</div>
                    <div style={{ fontSize: 12, color: "#9898b0" }}>{emp.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#9898b0" }}>{emp.goals.length} goals · {totalW}% weight</span>
                  {submitted > 0 && <span style={{ fontSize: 11, background: "rgba(245,158,11,0.1)", color: "#f59e0b", padding: "3px 8px", borderRadius: 6 }}>{submitted} pending</span>}
                  {approved > 0 && <span style={{ fontSize: 11, background: "rgba(34,197,94,0.1)", color: "#22c55e", padding: "3px 8px", borderRadius: 6 }}>{approved} approved</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ApprovalsView({ teamGoals, loading, expandedEmployee, setExpandedEmployee, comments, setComments, editTargets, setEditTargets, showEditModal, setShowEditModal, onApprove, onApproveAll, onRework, onSaveEdit }: any) {
  const employeesWithSubmitted = teamGoals.filter((e: any) => e.goals.some((g: any) => g.status === "SUBMITTED" || g.status === "DRAFT" || g.status === "REWORK_REQUESTED"));

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#5a5a72" }}>Loading…</div>;

  if (employeesWithSubmitted.length === 0) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>✅</div>
      <div style={{ fontWeight: 600, color: "#9898b0" }}>All caught up!</div>
      <div style={{ fontSize: 13, color: "#5a5a72", marginTop: 6 }}>No goals pending approval</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Goal Approvals</div>
      <div style={{ fontSize: 13, color: "#9898b0", marginBottom: 24 }}>Review, edit inline, approve or request rework</div>

      {teamGoals.map((emp: any) => {
        const isExpanded = expandedEmployee === emp.id;
        const submitted = emp.goals.filter((g: any) => g.status === "SUBMITTED");
        const allGoals = emp.goals;

        return (
          <div key={emp.id} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpandedEmployee(isExpanded ? null : emp.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(124,106,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#a594ff" }}>{emp.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: "#9898b0" }}>{allGoals.length} goals · {allGoals.reduce((s: number, g: any) => s + g.weightage, 0)}% total weight</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {submitted.length > 0 && (
                  <button onClick={e => { e.stopPropagation(); onApproveAll(emp.id); }} style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    ✅ Approve All ({submitted.length})
                  </button>
                )}
                <span style={{ fontSize: 18, color: "#5a5a72" }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                {allGoals.map((g: any, i: number) => (
                  <div key={g.id} style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.04)", borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: "#5a5a72", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{g.thrustArea}</div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{g.title}</div>
                        {g.description && <div style={{ fontSize: 12, color: "#9898b0", marginBottom: 10 }}>{g.description}</div>}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, background: "#1e1e2e", padding: "3px 8px", borderRadius: 6, color: "#9898b0" }}>⚖️ {g.weightage}%</span>
                          <span style={{ fontSize: 11, background: "#1e1e2e", padding: "3px 8px", borderRadius: 6, color: "#9898b0" }}>📏 {g.uomType.replace("_", " ")}</span>
                          <span style={{ fontSize: 11, background: "#1e1e2e", padding: "3px 8px", borderRadius: 6, color: "#9898b0" }}>🎯 {g.target ?? g.targetDate ?? "—"}</span>
                          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: g.status === "APPROVED" ? "rgba(34,197,94,0.1)" : g.status === "SUBMITTED" ? "rgba(245,158,11,0.1)" : g.status === "REWORK_REQUESTED" ? "rgba(239,68,68,0.1)" : "rgba(124,106,255,0.1)", color: g.status === "APPROVED" ? "#22c55e" : g.status === "SUBMITTED" ? "#f59e0b" : g.status === "REWORK_REQUESTED" ? "#ef4444" : "#a594ff" }}>
                            {g.status === "APPROVED" ? "✓ Approved" : g.status === "SUBMITTED" ? "⏳ Pending" : g.status === "REWORK_REQUESTED" ? "↩ Rework" : "○ Draft"}
                          </span>
                        </div>
                      </div>

                      {g.status === "SUBMITTED" && (
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button onClick={() => { setShowEditModal(g.id); setEditTargets({ ...editTargets, [g.id]: { target: g.target, weightage: g.weightage } }); }}
                            style={{ padding: "7px 12px", borderRadius: 8, background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.12)", color: "#e8e8f0", cursor: "pointer", fontSize: 12 }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => onApprove(g.id)}
                            style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            ✅ Approve
                          </button>
                        </div>
                      )}
                    </div>

                    {g.status === "SUBMITTED" && (
                      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                        <input
                          placeholder="Add comment & request rework…"
                          value={comments[g.id] || ""}
                          onChange={e => setComments({ ...comments, [g.id]: e.target.value })}
                          style={{ flex: 1, padding: "8px 12px", background: "#16161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e8e8f0", fontSize: 12 }}
                        />
                        <button onClick={() => onRework(g.id, comments[g.id] || "")}
                          style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                          ↩ Rework
                        </button>
                      </div>
                    )}

                    {/* Inline Edit Modal */}
                    {showEditModal === g.id && (
                      <div style={{ marginTop: 14, background: "#16161f", border: "1px solid rgba(124,106,255,0.2)", borderRadius: 10, padding: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: "#a594ff" }}>✏️ Edit Goal (Manager)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, color: "#9898b0", display: "block", marginBottom: 5 }}>Target Value</label>
                            <input type="number" value={editTargets[g.id]?.target ?? ""} onChange={e => setEditTargets({ ...editTargets, [g.id]: { ...editTargets[g.id], target: e.target.value } })}
                              style={{ width: "100%", padding: "8px 12px", background: "#111118", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 13 }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: "#9898b0", display: "block", marginBottom: 5 }}>Weightage (%)</label>
                            <input type="number" value={editTargets[g.id]?.weightage ?? ""} onChange={e => setEditTargets({ ...editTargets, [g.id]: { ...editTargets[g.id], weightage: e.target.value } })}
                              style={{ width: "100%", padding: "8px 12px", background: "#111118", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8e8f0", fontSize: 13 }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setShowEditModal(null)} style={{ padding: "7px 14px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#9898b0", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                          <button onClick={() => onSaveEdit(g.id)} style={{ padding: "7px 14px", borderRadius: 8, background: "#7c6aff", border: "none", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Save Changes</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CheckinsView({ teamGoals, loading, comments, setComments, onComment }: any) {
  const goalsWithCheckins = teamGoals.flatMap((emp: any) =>
    emp.goals.filter((g: any) => g.status === "APPROVED").map((g: any) => ({ ...g, employeeName: emp.name }))
  );

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#5a5a72" }}>Loading…</div>;

  if (goalsWithCheckins.length === 0) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>📊</div>
      <div style={{ fontWeight: 600, color: "#9898b0" }}>No approved goals yet</div>
      <div style={{ fontSize: 13, color: "#5a5a72", marginTop: 6 }}>Approved goals will appear here for check-in review</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Check-in Review</div>
      <div style={{ fontSize: 13, color: "#9898b0", marginBottom: 24 }}>Review employee actuals and add comments</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {goalsWithCheckins.map((g: any) => {
          const latestCheckin = g.checkIns?.[g.checkIns.length - 1];
          return (
            <div key={g.id} style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: "#9898b0", marginTop: 2 }}>👤 {g.employeeName} · ⚖️ {g.weightage}%</div>
                </div>
                {latestCheckin?.score !== null && latestCheckin?.score !== undefined && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: latestCheckin.score >= 80 ? "#22c55e" : latestCheckin.score >= 50 ? "#f59e0b" : "#ef4444" }}>{Math.round(latestCheckin.score)}%</div>
                    <div style={{ fontSize: 10, color: "#5a5a72" }}>Score</div>
                  </div>
                )}
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#5a5a72", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Target</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{g.target ?? g.targetDate ?? "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#5a5a72", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Actual ({latestCheckin?.period ?? "—"})</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: latestCheckin ? "#e8e8f0" : "#5a5a72" }}>{latestCheckin?.actual ?? "Not logged"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#5a5a72", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: latestCheckin?.status === "COMPLETED" ? "#22c55e" : latestCheckin?.status === "ON_TRACK" ? "#7c6aff" : "#9898b0" }}>
                      {latestCheckin?.status?.replace("_", " ") ?? "Not started"}
                    </div>
                  </div>
                </div>
                {latestCheckin?.managerComment && (
                  <div style={{ background: "#16161f", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#9898b0", borderLeft: "2px solid #7c6aff" }}>
                    💬 {latestCheckin.managerComment}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <input placeholder="Add manager comment…" value={comments[g.id] || ""}
                    onChange={e => setComments({ ...comments, [g.id]: e.target.value })}
                    style={{ flex: 1, padding: "8px 12px", background: "#16161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e8e8f0", fontSize: 12 }} />
                  <button onClick={() => onComment(g.id, latestCheckin?.period || "Q2")}
                    style={{ padding: "8px 14px", borderRadius: 8, background: "#7c6aff", border: "none", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    💬 Comment
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