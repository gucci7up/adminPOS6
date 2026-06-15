import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/agencias', label: 'Agencias', icon: '🏢' },
  { to: '/usuarios', label: 'Usuarios', icon: '👤' },
  { to: '/reportes', label: 'Reportes', icon: '📊' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-primary print:hidden">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <span className="text-xl font-bold tracking-tight text-accent">Admin</span>
          <span className="text-xl font-bold tracking-tight">POS6</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-secondary text-accent'
                    : 'text-muted hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border px-4 py-4">
          <p className="truncate text-xs text-muted">{user?.username}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-secondary cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar (mobile) */}
        <header className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 md:hidden print:hidden">
          <span className="text-lg font-bold">
            <span className="text-accent">Admin</span> POS6
          </span>
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm cursor-pointer"
          >
            ☰
          </button>
        </header>

        {menuOpen && (
          <nav className="flex flex-col border-b border-border bg-primary px-3 py-2 md:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-secondary text-accent' : 'text-muted'
                  }`
                }
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={logout}
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted cursor-pointer"
            >
              Cerrar sesión ({user?.username})
            </button>
          </nav>
        )}

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
