import { useEffect, useState, type FormEvent } from 'react';
import { apiClient, ApiException } from '../api/client';
import type { Agency } from '../types';

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  async function refresh() {
    setIsLoading(true);
    try {
      const data = await apiClient.getAgencies();
      setAgencies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);
    try {
      await apiClient.createAgency({ name, code, active: true });
      setName('');
      setCode('');
      setShowForm(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(agency: Agency) {
    setEditingId(agency.id);
    setEditName(agency.name);
    setEditCode(agency.code);
  }

  async function saveEdit(id: string) {
    try {
      await apiClient.updateAgency(id, { name: editName, code: editCode });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    }
  }

  async function toggleActive(agency: Agency) {
    try {
      await apiClient.updateAgency(agency.id, { active: !agency.active });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    }
  }

  async function handleDelete(agency: Agency) {
    if (!window.confirm(`¿Eliminar la agencia "${agency.name}"?`)) return;
    try {
      await apiClient.deleteAgency(agency.id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agencias</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-primary transition-opacity duration-150 hover:opacity-90 cursor-pointer"
        >
          {showForm ? 'Cancelar' : '+ Nueva agencia'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-muted" htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-muted" htmlFor="code">
              Código
            </label>
            <input
              id="code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-border bg-primary px-3 py-2 text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-primary transition-opacity duration-150 hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? 'Guardando...' : 'Crear'}
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
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Activo</th>
              <th className="px-4 py-3 font-medium">Creada</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            ) : agencies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No hay agencias registradas.
                </td>
              </tr>
            ) : (
              agencies.map((agency) => (
                <tr key={agency.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  {editingId === agency.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-primary px-2 py-1.5 text-foreground outline-none focus:border-accent"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          className="w-full rounded-lg border border-border bg-primary px-2 py-1.5 text-foreground outline-none focus:border-accent"
                        />
                      </td>
                      <td className="px-4 py-2 text-muted">{agency.active ? 'Sí' : 'No'}</td>
                      <td className="px-4 py-2 text-muted">{new Date(agency.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(agency.id)}
                            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-primary cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{agency.name}</td>
                      <td className="px-4 py-3 tabular-nums text-muted">{agency.code}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            agency.active ? 'bg-positive/15 text-positive' : 'bg-muted/15 text-muted'
                          }`}
                        >
                          {agency.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{new Date(agency.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(agency)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-secondary cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(agency)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-secondary cursor-pointer"
                          >
                            {agency.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(agency)}
                            className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive transition-colors duration-150 hover:bg-destructive/10 cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
