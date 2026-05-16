"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ROLES = [
    { key: "employee", icon: "👤", label: "Employee" },
    { key: "manager", icon: "👔", label: "Manager" },
    { key: "admin", icon: "🛡️", label: "Admin / HR" },
  ];

  const DEMO = {
    employee: { email: "employee@company.com", password: "employee123" },
    manager: { email: "manager@company.com", password: "manager123" },
    admin: { email: "admin@company.com", password: "admin123" },
  };

  function fillDemo() {
    setEmail(DEMO[role as keyof typeof DEMO].email);
    setPassword(DEMO[role as keyof typeof DEMO].password);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const userRole = session?.user?.role;

    if (userRole === "ADMIN") router.push("/admin");
    else if (userRole === "MANAGER") router.push("/manager");
    else router.push("/employee");
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0a0a0f", position: "relative", overflow: "hidden", fontFamily: "system-ui, sans-serif"
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,106,255,0.12) 0%, transparent 70%)"
      }}/>
      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }}/>

      <div style={{
        width: 420, background: "#111118", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20, padding: 40, position: "relative", zIndex: 1,
        boxShadow: "0 0 80px rgba(124,106,255,0.1), 0 8px 48px rgba(0,0,0,0.6)"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#7c6aff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 0 20px rgba(124,106,255,0.4)"
          }}>🎯</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#e8e8f0" }}>GoalPort</div>
            <div style={{ fontSize: 11, color: "#5a5a72" }}>Performance Management Portal</div>
          </div>
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: "#e8e8f0", marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 14, color: "#9898b0", marginBottom: 28, lineHeight: 1.5 }}>
          Sign in to access your goal setting & tracking dashboard
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#9898b0", marginBottom: 8 }}>Sign in as</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {ROLES.map(r => (
              <div key={r.key} onClick={() => setRole(r.key)} style={{
                padding: "12px 8px", borderRadius: 8, textAlign: "center", cursor: "pointer",
                border: role === r.key ? "1px solid #7c6aff" : "1px solid rgba(255,255,255,0.07)",
                background: role === r.key ? "rgba(124,106,255,0.15)" : "#16161f",
                transition: "all 0.18s"
              }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{r.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: role === r.key ? "#a594ff" : "#9898b0" }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9898b0", marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" required
              style={{
                width: "100%", padding: "10px 14px", background: "#16161f",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
                color: "#e8e8f0", fontSize: 14, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9898b0", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                width: "100%", padding: "10px 14px", background: "#16161f",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
                color: "#e8e8f0", fontSize: 14, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px", background: "#7c6aff", color: "white",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", marginBottom: 10,
            opacity: loading ? 0.7 : 1, transition: "all 0.18s"
          }}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          <button type="button" onClick={fillDemo} style={{
            width: "100%", padding: "10px", background: "transparent", color: "#5a5a72",
            border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer"
          }}>
            Fill demo credentials for {role}
          </button>
        </form>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "20px 0" }}/>
        <div style={{ textAlign: "center", fontSize: 11, color: "#5a5a72" }}>
          FY 2025–26 · Q2 Check-in Window Open · Cycle managed by HR Admin
        </div>
      </div>
    </div>
  );
}