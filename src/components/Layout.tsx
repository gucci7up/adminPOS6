import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IcoDashboard() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IcoAgency() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function IcoUsers() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IcoReports() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IcoConfig() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IcoLogout() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  );
}

function IcoMenu() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function IcoClose() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    section: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', Icon: IcoDashboard }],
  },
  {
    section: 'Gestión',
    items: [
      { to: '/agencias', label: 'Agencias', Icon: IcoAgency },
      { to: '/usuarios', label: 'Usuarios', Icon: IcoUsers },
    ],
  },
  {
    section: 'Reportes',
    items: [{ to: '/reportes', label: 'Reportes', Icon: IcoReports }],
  },
  {
    section: 'Sistema',
    items: [{ to: '/configuracion', label: 'Configuración', Icon: IcoConfig }],
  },
];

const BREADCRUMB_MAP: Record<string, { section: string; label: string }> = {
  '/dashboard': { section: 'Overview', label: 'Dashboard' },
  '/agencias': { section: 'Gestión', label: 'Agencias' },
  '/usuarios': { section: 'Gestión', label: 'Usuarios' },
  '/reportes': { section: 'Reportes', label: 'Reportes' },
  '/configuracion': { section: 'Sistema', label: 'Configuración' },
};

// ── Sidebar nav item ──────────────────────────────────────────────────────────

function SideNavItem({
  to,
  label,
  Icon,
  onClick,
}: {
  to: string;
  label: string;
  Icon: () => React.ReactElement;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer group ${
          isActive
            ? 'bg-secondary text-foreground'
            : 'text-muted hover:bg-secondary/60 hover:text-foreground'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-accent"
            />
          )}
          <span className={isActive ? 'text-accent' : 'text-muted group-hover:text-foreground'}>
            <Icon />
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = user?.role === 'OWNER';

  const visibleSections = NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: isOwner ? sec.items.filter((i) => i.to !== '/configuracion') : sec.items,
  })).filter((sec) => sec.items.length > 0);

  const breadcrumb = BREADCRUMB_MAP[location.pathname];

  return (
    <div className="flex min-h-screen bg-background text-foreground">

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col border-r border-border print:hidden"
        style={{ backgroundColor: '#0E1A12' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <img src={logo} alt="MBSport" className="h-9 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-black">
              <span className="text-accent">MB</span>
              <span className="text-foreground">Sport</span>
            </span>
            <span className="text-[11px] text-muted">Admin Panel</span>
          </div>
        </div>

        {/* User welcome */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[11px] text-muted mb-0.5">Bienvenido de vuelta,</p>
          <p className="font-black text-foreground text-base leading-tight truncate">{user?.username}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-accent uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {isOwner ? 'Dueño de Agencia' : 'Administrador'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          {visibleSections.map(({ section, items }) => (
            <div key={section}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted/60">
                {section}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <SideNavItem key={item.to} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-border px-3 py-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-secondary/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <IcoLogout />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar: breadcrumb + search */}
        <header
          className="flex items-center justify-between px-5 py-3 border-b border-border print:hidden"
          style={{ backgroundColor: '#0E1A12' }}
        >
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen((v) => !v)}
              className="text-muted hover:text-foreground cursor-pointer"
            >
              {menuOpen ? <IcoClose /> : <IcoMenu />}
            </button>
            <img src={logo} alt="MBSport" className="h-7 w-auto" />
          </div>

          {/* Desktop: breadcrumb */}
          {breadcrumb && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-muted">{breadcrumb.section}</span>
              <span className="text-border">/</span>
              <span className="font-semibold text-foreground">{breadcrumb.label}</span>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-1.5 w-48 md:w-64">
            <svg className="h-3.5 w-3.5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent text-sm text-foreground placeholder-muted/50 outline-none w-full"
            />
          </div>
        </header>

        {/* Mobile menu drawer */}
        {menuOpen && (
          <nav
            className="flex flex-col border-b border-border px-3 py-3 md:hidden print:hidden space-y-3"
            style={{ backgroundColor: '#0E1A12' }}
          >
            <div className="px-3 pb-1 border-b border-border">
              <p className="text-[11px] text-muted">Bienvenido,</p>
              <p className="font-bold text-foreground text-sm">{user?.username}</p>
            </div>
            {visibleSections.map(({ section, items }) => (
              <div key={section}>
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted/60">{section}</p>
                {items.map((item) => (
                  <SideNavItem key={item.to} {...item} onClick={() => setMenuOpen(false)} />
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-secondary cursor-pointer mt-1"
            >
              <IcoLogout />
              Cerrar sesión
            </button>
          </nav>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
