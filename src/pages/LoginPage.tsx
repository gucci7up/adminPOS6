import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatUsername(digits: string): string {
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 12)];
  return groups.filter(Boolean).join('-');
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accessNumber, setAccessNumber] = useState('');
  const [pin, setPin] = useState('');
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-xl"
      >
        <h1 className="mb-1 text-center text-2xl font-bold">
          <span className="text-accent">Admin</span> POS6
        </h1>
        <p className="mb-6 text-center text-sm text-muted">Acceso solo para administradores</p>

        <label className="mb-1 block text-sm font-medium text-muted" htmlFor="accessNumber">
          Número de acceso
        </label>
        <input
          id="accessNumber"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          placeholder="000-000-000-001"
          value={accessNumber}
          onChange={(e) => setAccessNumber(e.target.value)}
          maxLength={15}
          className="mb-4 w-full rounded-lg border border-border bg-primary px-3 py-2.5 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />

        <label className="mb-1 block text-sm font-medium text-muted" htmlFor="pin">
          PIN (8 dígitos)
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="••••••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={8}
          className="mb-6 w-full rounded-lg border border-border bg-primary px-3 py-2.5 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />

        {error && (
          <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-bold text-primary transition-opacity duration-150 hover:opacity-90 disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? 'Verificando...' : 'Acceder'}
        </button>
      </form>
    </div>
  );
}
