import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, ApiException } from '../api/client';
import type { Agency, User } from '../types';
import { useAuth } from '../context/AuthContext';

function formatUsername(digits: string): string {
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 12)];
  return groups.filter(Boolean).join('-');
}

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-accent/15 text-accent',
  OWNER: 'bg-blue-500/15 text-blue-400',
  CASHIER: 'bg-muted/15 text-muted',
};

export default function UsersPage() {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [accessNumber, setAccessNumber] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<'CASHIER' | 'OWNER'>('CASHIER');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingId, setPendingId] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    try {
      const [usersData, agenciesData] = await Promise.all([apiClient.getUsers(), apiClient.getAgencies()]);
      setUsers(usersData);
      setAgencies(agenciesData);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const digits = accessNumber.replace(/\D/g, '');
    if (digits.length !== 12) {
      setFormError('El número de acceso debe tener 12 dígitos.');
      return;
    }
    if (!/^\d{8}$/.test(pin)) {
      setFormError('El PIN debe tener 8 dígitos.');
      return;
    }

    setFormError(null);
    setIsSaving(true);
    try {
      await apiClient.registerUser({
        username: formatUsername(digits),
        password: pin,
        email: email.trim() || undefined,
        role: isAdmin ? newRole : 'CASHIER',
      });
      setAccessNumber('');
      setPin('');
      setEmail('');
      setNewRole('CASHIER');
      setShowForm(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignAgency(userId: string, agencyId: string) {
    if (!agencyId) return;
    setPendingId(userId);
    try {
      await apiClient.assignUserAgency(userId, agencyId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setPendingId(null);
    }
  }

  async function handleMakeAdmin(user: User) {
    if (!window.confirm(`¿Convertir a "${user.username}" en ADMIN?`)) return;
    setPendingId(user.id);
    try {
      await apiClient.makeAdmin(user.id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setPendingId(null);
    }
  }

  async function handleMakeOwner(user: User) {
    if (!window.confirm(`¿Convertir a "${user.username}" en DUEÑO (OWNER)?`)) return;
    setPendingId(user.id);
    try {
      await apiClient.makeOwner(user.id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-primary transition-opacity duration-150 hover:opacity-90 cursor-pointer"
        >
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end sm:flex-wrap"
        >
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-muted" htmlFor="accessNumber">
              Número de acceso (12 dígitos)
            </label>
            <input
              id="accessNumber"
              required
              inputMode="numeric"
              placeholder="000-000-000-002"
              value={accessNumber}
              onChange={(e) => setAccessNumber(e.target.value)}
              maxLength={15}
              className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-sm font-medium text-muted" htmlFor="pin">
              PIN (8 dígitos)
            </label>
            <input
              id="pin"
              required
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={8}
              className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-sm font-medium text-muted" htmlFor="email">
              Email (opcional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>
          {isAdmin && (
            <div className="min-w-[120px]">
              <label className="mb-1 block text-sm font-medium text-muted" htmlFor="newRole">
                Rol
              </label>
              <select
                id="newRole"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'CASHIER' | 'OWNER')}
                className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-foreground outline-none focus:border-accent cursor-pointer"
              >
                <option value="CASHIER">Cajero</option>
                <option value="OWNER">Dueño</option>
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-primary transition-opacity duration-150 hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? 'Creando...' : `Crear ${newRole === 'OWNER' ? 'dueño' : 'cajero'}`}
          </button>
          {formError && <p className="text-sm text-destructive sm:basis-full">{formError}</p>}
        </form>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Agencia</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium tabular-nums">{u.username}</td>
                  <td className="px-4 py-3 text-muted">{u.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[u.role] ?? ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'CASHIER' ? (
                      <select
                        value={u.agencyId ?? ''}
                        onChange={(e) => handleAssignAgency(u.id, e.target.value)}
                        disabled={pendingId === u.id}
                        className="rounded-lg border border-border bg-primary px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent disabled:opacity-60 cursor-pointer"
                      >
                        <option value="" disabled>
                          Sin agencia
                        </option>
                        {agencies.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isAdmin && u.role === 'CASHIER' && (
                        <button
                          type="button"
                          onClick={() => handleMakeOwner(u)}
                          disabled={pendingId === u.id}
                          className="rounded-lg border border-blue-500/40 px-3 py-1.5 text-xs text-blue-400 transition-colors duration-150 hover:bg-blue-500/10 disabled:opacity-60 cursor-pointer"
                        >
                          Hacer dueño
                        </button>
                      )}
                      {isAdmin && u.role === 'CASHIER' && (
                        <button
                          type="button"
                          onClick={() => handleMakeAdmin(u)}
                          disabled={pendingId === u.id}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-secondary disabled:opacity-60 cursor-pointer"
                        >
                          Hacer admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
