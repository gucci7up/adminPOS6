import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import backgroundImage from '../assets/background.jpeg';
import logo from '../assets/logo.png';

function formatUsername(digits: string): string {
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 12)];
  return groups.filter(Boolean).join('-');
}

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconSpeed() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accessNumber, setAccessNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [keepSession, setKeepSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/agencias';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = accessNumber.replace(/\D/g, '');
    if (digits.length !== 12) {
      setError('El número de acceso debe tener 12 dígitos.');
      return;
    }
    if (!/^\d{8}$/.test(pin)) {
      setError('El PIN debe tener 8 dígitos.');
      return;
    }
    setError(null);
    setIsLoading(true);
    const result = await login(formatUsername(digits), pin);
    setIsLoading(false);
    if (result) {
      setError(result);
    } else {
      navigate('/agencias', { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#080A08' }}>

      {/* ── LEFT PANEL: hero / branding ───────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />

        {/* Logo */}
        <div className="relative z-10">
          <img src={logo} alt="MBSport Racing Dogs" className="h-16 w-auto" />
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
            CONTROL TOTAL.
            <br />
            RENDIMIENTO{' '}
            <span className="text-accent">REAL.</span>
          </h2>
        </div>

        {/* Features row */}
        <div className="relative z-10 flex items-start gap-10">
          <div className="text-center">
            <IconShield />
            <p className="mt-2 text-xs font-bold text-white tracking-widest">SEGURO</p>
            <p className="text-[11px] text-white/55 mt-0.5">Acceso protegido</p>
          </div>
          <div className="text-center">
            <IconSpeed />
            <p className="mt-2 text-xs font-bold text-white tracking-widest">RÁPIDO</p>
            <p className="text-[11px] text-white/55 mt-0.5">Información al instante</p>
          </div>
          <div className="text-center">
            <IconChart />
            <p className="mt-2 text-xs font-bold text-white tracking-widest">EFICIENTE</p>
            <p className="text-[11px] text-white/55 mt-0.5">Control y estadísticas</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: login form ───────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-between px-6 py-10 lg:w-1/2"
        style={{ backgroundColor: '#0D0F0D' }}
      >
        <div className="w-full max-w-md flex flex-col flex-1 justify-center gap-0">

          {/* Logo */}
          <div className="mb-7 text-center">
            <img src={logo} alt="MBSport Racing Dogs" className="mx-auto h-20 w-auto" />
          </div>

          {/* Title */}
          <div className="text-center mb-7">
            <h1 className="text-3xl font-black tracking-wider leading-none">
              <span className="text-accent">ADMIN</span>{' '}
              <span className="text-foreground">CONTROL CENTER</span>
            </h1>
            <div className="mt-3 mx-auto h-0.5 w-16 rounded-full bg-accent" />
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Inicia sesión para acceder al panel<br />de administración del sistema
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Usuario */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: '#7A8A7A' }}>
                Usuario
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60">
                  <IconUser />
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="000-000-000-000"
                  value={accessNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setAccessNumber(digits.replace(/(\d{3})(?=\d)/g, '$1-'));
                  }}
                  maxLength={15}
                  style={{ backgroundColor: '#151915', borderColor: '#252B25' }}
                  className="w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-[#3A4A3A] outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/25"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: '#7A8A7A' }}>
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60">
                  <IconLock />
                </span>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={8}
                  style={{ backgroundColor: '#151915', borderColor: '#252B25' }}
                  className="w-full rounded-xl border py-3.5 pl-11 pr-12 text-sm text-foreground placeholder:text-[#3A4A3A] outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/60 hover:text-muted transition-colors cursor-pointer"
                >
                  <IconEye open={showPin} />
                </button>
              </div>
            </div>

            {/* Keep session + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepSession}
                  onChange={(e) => setKeepSession(e.target.checked)}
                  className="h-4 w-4 rounded cursor-pointer accent-accent"
                  style={{ borderColor: '#252B25' }}
                />
                <span className="text-xs text-muted">Mantener sesión iniciada</span>
              </label>
              <button type="button" className="text-xs text-accent hover:underline cursor-pointer">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex w-full items-center justify-center gap-3 rounded-xl bg-accent py-4 text-sm font-black tracking-[0.15em] uppercase text-black transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer shadow-lg"
              style={{ boxShadow: '0 4px 24px rgba(212,175,55,0.3)' }}
            >
              <IconArrow />
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Status bar */}
          <div
            className="mt-6 flex items-stretch rounded-xl overflow-hidden"
            style={{ border: '1px solid #1E261E', backgroundColor: '#111511' }}
          >
            <div className="flex flex-1 items-center gap-3 px-4 py-3">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-positive"
                style={{ boxShadow: '0 0 8px #22C55E' }}
              />
              <div>
                <p className="text-xs font-bold tracking-wider text-positive">SISTEMA CONECTADO</p>
                <p className="text-[11px] text-muted/70">Todos los servicios operativos</p>
              </div>
            </div>
            <div
              className="flex flex-col items-center justify-center px-5"
              style={{ borderLeft: '1px solid #1E261E' }}
            >
              <p className="text-sm font-bold text-foreground">v2.4.0</p>
              <p className="text-[11px] text-muted/70">API Online</p>
            </div>
          </div>

          {/* Tech stack */}
          <div className="mt-4 flex items-center justify-center gap-5 text-[11px]" style={{ color: '#3A4A3A' }}>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.998 0C5.372 0 0 5.372 0 11.998S5.372 24 11.998 24 24 18.626 24 11.998 18.626 0 11.998 0zm-.297 4.105l1.3.75v9.767l5.023-2.9.004.008-1.3 2.252-3.727 2.153-1.3-.75V4.105zm-1.3 2.252v9.769l-5.027-2.9 1.3-2.252 3.727 2.153V6.357z"/>
              </svg>
              NestJS
            </span>
            <span style={{ color: '#252B25' }}>|</span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.128 0a10.134 10.134 0 00-2.755.403 5.834 5.834 0 00-1.765 1.016 4.174 4.174 0 00-1.59 3.185 4.015 4.015 0 001.082 2.862 6.978 6.978 0 002.855 1.715c.963.293 1.6.535 1.907.725.3.19.454.462.46.816a.77.77 0 01-.29.642c-.193.157-.516.236-.967.236-.618 0-1.394-.177-2.328-.53a9.957 9.957 0 01-2.03-1.109l-.607 3.337a9.012 9.012 0 002.097.867 11.83 11.83 0 002.977.348 7.4 7.4 0 002.843-.499 4.218 4.218 0 001.798-1.413 3.77 3.77 0 00.635-2.155 3.798 3.798 0 00-.501-1.98 4.268 4.268 0 00-1.441-1.44 11.918 11.918 0 00-2.617-1.025c-.826-.24-1.373-.464-1.641-.672-.27-.208-.402-.47-.396-.785a.755.755 0 01.297-.625c.2-.163.495-.244.882-.244.578 0 1.22.1 1.925.302a9.85 9.85 0 011.698.675l.572-3.27A10.21 10.21 0 0017.128 0zM0 .237v23.526h3.787V14.2h2.466l3.526 9.563h4.044l-3.892-10.04A5.46 5.46 0 0012 9.228a5.043 5.043 0 00-1.457-3.74C9.694 4.67 8.34 4.103 6.47 4.103H0V.237zm3.787 3.98H6.04c.85 0 1.474.2 1.872.598.397.397.595.96.595 1.685 0 .782-.216 1.38-.647 1.794-.432.415-1.074.622-1.927.622H3.787V4.217z"/>
              </svg>
              PostgreSQL
            </span>
            <span style={{ color: '#252B25' }}>|</span>
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Secure Access
            </span>
          </div>

        </div>

        {/* Copyright */}
        <p className="mt-6 text-center text-[11px]" style={{ color: '#2A3A2A' }}>
          © 2025 MBSPORT Racing Dogs. Todos los derechos reservados.
        </p>
      </div>

    </div>
  );
}
