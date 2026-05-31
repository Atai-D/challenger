import { StoreProvider, useStore } from "./store";
import { UserApp } from "./views/UserApp";
import { OrgApp } from "./views/OrgApp";
import { AdminApp } from "./views/AdminApp";
import { Login } from "./views/Login";
import { Avatar } from "./components/ui";

const ROLE_LABEL = {
  USER: "User",
  ORG: "Organization",
  ADMIN: "Platform Admin",
} as const;

function Header() {
  const store = useStore();
  const session = store.session;
  if (!session) return null;

  const initials = session.displayName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark">🏅</span>
          <div>
            <div className="brand-name">Challenge Rewards</div>
            <div className="brand-sub">{ROLE_LABEL[session.role]} workspace</div>
          </div>
        </div>

        <div className="header-right">
          <div className="who">
            <Avatar text={initials} tone={session.role === "USER" ? "user" : "brand"} />
            <div className="who-meta">
              <div className="who-name">{session.displayName}</div>
              <div className="who-role">@{session.username}</div>
            </div>
          </div>
          <button
            className="icon-btn"
            title="Reset demo data"
            onClick={() => {
              if (confirm("Reset all demo data to defaults?")) store.reset();
            }}
          >
            ↺
          </button>
          <button className="icon-btn" title="Sign out" onClick={() => store.logout()}>
            ⎋
          </button>
        </div>
      </div>
    </header>
  );
}

function Shell() {
  const store = useStore();

  if (store.booting) {
    return (
      <div className="app">
        <div className="loading-state">Connecting to the H2 database…</div>
      </div>
    );
  }

  if (!store.session) {
    return <Login />;
  }

  return (
    <div className="app">
      <Header />
      <main>
        {store.session.role === "USER" && <UserApp />}
        {store.session.role === "ORG" && <OrgApp />}
        {store.session.role === "ADMIN" && <AdminApp />}
      </main>
      <footer className="app-footer">
        Challenge Rewards · Hackathon MVP · React + Spring Boot + H2 database
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
