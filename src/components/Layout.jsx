import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">TF</span><span>TaskFlow</span></div>
        <div className="user-menu">
          <div className="user-copy"><strong>{user.name}</strong><span>{user.role}</span></div>
          <button className="text-button" onClick={logout}>Sign out</button>
        </div>
      </header>
      <div className="shell-body">
        <aside className="sidebar" aria-label="Primary navigation">
          <nav>
            <NavLink to="/dashboard"><span className="nav-icon">▦</span>Dashboard</NavLink>
            <NavLink to="/tickets"><span className="nav-icon">▤</span>Tickets</NavLink>
            <NavLink to="/users"><span className="nav-icon">●</span>Users</NavLink>
          </nav>
          <div className="version">TaskFlow v1.0</div>
        </aside>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
