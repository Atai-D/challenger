import { useState } from "react";
import { useStore } from "../store";
import type { Role } from "../types";
import { Button } from "../components/ui";

type LoginRole = "USER" | "ORG" | "ADMIN";

const ROLE_META: Record<LoginRole, { icon: string; label: string; blurb: string }> = {
  USER: { icon: "👤", label: "User", blurb: "Join challenges and earn rewards." },
  ORG: { icon: "🏢", label: "Organization", blurb: "Create challenges and issue coupons." },
  ADMIN: { icon: "🛡️", label: "Platform", blurb: "Review and approve challenges." },
};

const DEMO_CREDENTIALS: Record<LoginRole, { username: string; password: string }> = {
  USER: { username: "alex", password: "alex123" },
  ORG: { username: "coffeelab", password: "coffee123" },
  ADMIN: { username: "admin", password: "admin123" },
};

export function Login() {
  const store = useStore();
  const [role, setRole] = useState<LoginRole>("USER");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const canRegister = role !== "ADMIN";

  const switchRole = (r: LoginRole) => {
    setRole(r);
    if (r === "ADMIN") setMode("login");
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "register" && canRegister) {
        await store.register({ username, password, role: role as Role, displayName });
      } else {
        await store.login(username, password);
      }
    } catch {
      // error surfaced via store.authError
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    const creds = DEMO_CREDENTIALS[role];
    setUsername(creds.username);
    setPassword(creds.password);
    setMode("login");
  };

  const disabled =
    busy ||
    !username.trim() ||
    !password.trim() ||
    (mode === "register" && !displayName.trim());

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">🏅</span>
          <div>
            <div className="brand-name">Challenge Rewards</div>
            <div className="brand-sub">Sign in to continue</div>
          </div>
        </div>

        <div className="role-picker">
          {(Object.keys(ROLE_META) as LoginRole[]).map((r) => (
            <button
              key={r}
              className={`role-btn ${role === r ? "role-active" : ""}`}
              onClick={() => switchRole(r)}
              type="button"
            >
              <span className="role-icon">{ROLE_META[r].icon}</span>
              <span>{ROLE_META[r].label}</span>
            </button>
          ))}
        </div>
        <p className="muted small auth-blurb">{ROLE_META[role].blurb}</p>

        {canRegister && (
          <div className="seg auth-seg">
            <button
              type="button"
              className={`seg-btn ${mode === "login" ? "seg-active" : ""}`}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`seg-btn ${mode === "register" ? "seg-active" : ""}`}
              onClick={() => setMode("register")}
            >
              Create account
            </button>
          </div>
        )}

        {mode === "register" && canRegister && (
          <>
            <label className="field-label">
              {role === "ORG" ? "Organization name" : "Display name"}
            </label>
            <input
              className="input"
              placeholder={role === "ORG" ? "e.g. Sunrise Bakery" : "e.g. Jordan"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </>
        )}

        <label className="field-label">Username</label>
        <input
          className="input"
          placeholder="username"
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && submit()}
        />
        <label className="field-label">Password</label>
        <input
          className="input"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && submit()}
        />

        {store.authError && <div className="auth-error">{store.authError}</div>}

        <Button className="auth-submit" onClick={submit} disabled={disabled}>
          {busy
            ? "Please wait…"
            : mode === "register"
              ? `Create ${ROLE_META[role].label} account`
              : `Sign in as ${ROLE_META[role].label}`}
        </Button>

        <button type="button" className="demo-link" onClick={fillDemo}>
          Use demo {ROLE_META[role].label.toLowerCase()} credentials
        </button>
      </div>
    </div>
  );
}
