import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { AgencyJackpotPool, GameConfig } from '../types';

type Toast = { id: number; text: string; ok: boolean };
let toastId = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((text: string, ok: boolean) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, text, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function SectionCard({ title, icon, children, className }: { title: string; icon: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-primary p-6 flex flex-col gap-5 ${className ?? ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-muted">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted opacity-70">{hint}</p>}
    </div>
  );
}

function NumericInput({ value, onChange, min, max, step }: {
  value: string; onChange: (v: string) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step ?? 'any'}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
        checked ? 'bg-accent' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SaveButton({ loading, onClick, label }: { loading: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
    >
      {loading ? 'Guardando...' : (label ?? 'Guardar')}
    </button>
  );
}

function Stat({ label, value, accent, small }: { label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-bold truncate ${accent ? 'text-accent text-xl' : small ? 'text-xs text-foreground' : 'text-sm text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2">
      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent text-black text-[10px] font-bold flex items-center justify-center">{n}</span>
      <span>{text}</span>
    </div>
  );
}

export default function ConfigPage() {
  const { toasts, add } = useToasts();

  // ── Global X2 ──────────────────────────────────────────────────────────────
  const [globalLoading, setGlobalLoading] = useState(true);
  const [x2Enabled, setX2Enabled] = useState(true);
  const [savingX2, setSavingX2] = useState(false);

  // ── Agency pools ───────────────────────────────────────────────────────────
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [agencyPools, setAgencyPools] = useState<AgencyJackpotPool[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Per-agency form ────────────────────────────────────────────────────────
  const [contribution, setContribution] = useState('');
  const [trigger, setTrigger] = useState('');
  const [bonusRate, setBonusRate] = useState('');
  const [savingAgency, setSavingAgency] = useState(false);
  const [resettingAgency, setResettingAgency] = useState(false);

  const loadGlobal = useCallback(async () => {
    try {
      const data = await apiClient.getGlobalConfig();
      setX2Enabled((data as GameConfig).x2Enabled);
    } catch {
      add('Error cargando configuración global', false);
    } finally {
      setGlobalLoading(false);
    }
  }, [add]);

  const loadPools = useCallback(async () => {
    try {
      const pools = await apiClient.getAllAgencyPools();
      setAgencyPools(pools);
      setSelectedId((prev) => prev ?? (pools.length > 0 ? pools[0].agencyId : null));
    } catch {
      add('Error cargando pozos por agencia', false);
    } finally {
      setPoolsLoading(false);
    }
  }, [add]);

  useEffect(() => {
    loadGlobal();
    loadPools();
  }, [loadGlobal, loadPools]);

  const selectedPool = agencyPools.find((p) => p.agencyId === selectedId) ?? null;

  // Populate form when selected agency changes
  useEffect(() => {
    if (!selectedPool) return;
    setContribution((parseFloat(selectedPool.contributionRate) * 100).toFixed(2));
    setTrigger(parseFloat(selectedPool.triggerMinAmount).toFixed(2));
    setBonusRate((parseFloat(selectedPool.trifectaBonusRate) * 100).toFixed(0));
  }, [selectedId, agencyPools]);

  async function saveX2() {
    setSavingX2(true);
    try {
      await apiClient.updateGlobalConfig({ x2Enabled });
      await loadGlobal();
      add(`X2 ${x2Enabled ? 'activado' : 'desactivado'}`, true);
    } catch (e: unknown) {
      add(e instanceof Error ? e.message : 'Error al guardar', false);
    } finally {
      setSavingX2(false);
    }
  }

  async function saveAgencyConfig() {
    if (!selectedId) return;
    setSavingAgency(true);
    try {
      const updated = await apiClient.updateAgencyConfig(selectedId, {
        contributionRate: parseFloat(contribution) / 100,
        triggerMinAmount: parseFloat(trigger),
        trifectaBonusRate: parseFloat(bonusRate) / 100,
      });
      setAgencyPools((prev) => prev.map((p) => (p.agencyId === selectedId ? { ...p, ...updated } : p)));
      add('Configuración guardada', true);
    } catch (e: unknown) {
      add(e instanceof Error ? e.message : 'Error al guardar', false);
    } finally {
      setSavingAgency(false);
    }
  }

  async function doResetAgencyPool() {
    if (!selectedId) return;
    const agencyName = selectedPool?.agency?.name ?? 'esta agencia';
    if (!confirm(`¿Reiniciar el pozo de "${agencyName}" a RD$ 0.00?`)) return;
    setResettingAgency(true);
    try {
      await apiClient.resetAgencyPool(selectedId);
      await loadPools();
      add('Pozo reiniciado a $0.00', true);
    } catch (e: unknown) {
      add(e instanceof Error ? e.message : 'Error al reiniciar', false);
    } finally {
      setResettingAgency(false);
    }
  }

  const poolAmount = selectedPool ? parseFloat(selectedPool.currentAmount).toFixed(2) : '0.00';
  const totalContrib = selectedPool ? parseFloat(selectedPool.totalContributed).toFixed(2) : '0.00';
  const totalAwarded = selectedPool ? parseFloat(selectedPool.totalAwarded).toFixed(2) : '0.00';
  const cur = 'RD$';
  const lastAward = selectedPool?.lastAwardedAt
    ? new Date(selectedPool.lastAwardedAt).toLocaleString('es-DO')
    : 'Nunca';

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg text-white transition-all ${
              t.ok ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {t.ok ? '✓' : '✗'} {t.text}
          </div>
        ))}
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración del Juego</h1>
        <p className="mt-1 text-sm text-muted">
          Jackpot y Bonus se configuran por agencia. El X2 es global para todas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── X2 GLOBAL ─────────────────────────────────────────────── */}
        <SectionCard title="Multiplicador X2" icon="⚡">
          {globalLoading ? (
            <p className="text-sm text-muted animate-pulse">Cargando...</p>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-secondary p-4">
                <p className="text-sm text-muted">
                  Al <span className="text-accent font-semibold">cerrar la venta</span> de cada
                  carrera, el sistema asigna aleatoriamente un perro (1–6) con cuota doble.
                  Aplica a apuestas GANAR, EXACTA y TRIFECTA que incluyan ese perro.
                </p>
                <p className="mt-2 text-xs text-muted opacity-70">
                  Ejemplo: perro 3 cuota 4.00 → con X2 liquida como 8.00.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Estado del X2</p>
                  <p className="text-xs text-muted">
                    {x2Enabled ? 'Activo — ~30% de probabilidad por carrera' : 'Inactivo — no se asigna X2'}
                  </p>
                </div>
                <Toggle checked={x2Enabled} onChange={setX2Enabled} />
              </div>

              <div className="rounded-lg border border-border p-3 text-xs text-muted space-y-1">
                <p className="font-semibold text-foreground mb-1">Flujo del X2</p>
                <Step n={1} text="Carrera ABIERTA — jugadores apuestan normalmente" />
                <Step n={2} text="Venta CERRADA — sistema sortea perro X2 (1 de 6)" />
                <Step n={3} text="POS muestra badge naranja «X2 Perro N»" />
                <Step n={4} text="Si el perro X2 gana, su cuota se duplica en la liquidación" />
              </div>

              <SaveButton loading={savingX2} onClick={saveX2} />
            </>
          )}
        </SectionCard>

        {/* ── JACKPOT & BONUS POR AGENCIA ───────────────────────────── */}
        <SectionCard title="Jackpot & Bonus por Agencia" icon="💰" className="lg:col-span-2">
          {poolsLoading ? (
            <p className="text-sm text-muted animate-pulse">Cargando agencias...</p>
          ) : agencyPools.length === 0 ? (
            <p className="text-sm text-muted">
              No hay agencias registradas. Crea una en la sección{' '}
              <span className="text-accent font-semibold">Agencias</span>.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

              {/* Agency selector list */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Seleccionar agencia</p>
                {agencyPools.map((pool) => {
                  const amount = parseFloat(pool.currentAmount).toFixed(2);
                  const isSelected = pool.agencyId === selectedId;
                  return (
                    <button
                      key={pool.agencyId}
                      type="button"
                      onClick={() => setSelectedId(pool.agencyId)}
                      className={`flex flex-col rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-secondary hover:border-accent/50'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                        {pool.agency?.name ?? pool.agencyId.slice(0, 8)}
                      </span>
                      <span className="text-xs text-muted">
                        {pool.agency?.code ?? '—'} · pozo: <span className="text-foreground">RD$ {amount}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Per-agency config form */}
              <div className="md:col-span-2 flex flex-col gap-4">
                {!selectedPool ? (
                  <p className="text-sm text-muted">Selecciona una agencia para ver su configuración.</p>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary p-4">
                      <Stat label="Pozo actual" value={`${cur} ${poolAmount}`} accent />
                      <Stat label="Último premio" value={lastAward} small />
                      <Stat label="Total contribuido" value={`${cur} ${totalContrib}`} />
                      <Stat label="Total pagado" value={`${cur} ${totalAwarded}`} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field
                        label="Contribución por ticket (%)"
                        hint="% de cada ticket al pozo. Ej: 1 = 1%"
                      >
                        <NumericInput value={contribution} onChange={setContribution} min={0} max={10} step={0.1} />
                      </Field>

                      <Field
                        label="Mínimo para activar (RD$)"
                        hint="El jackpot no cae hasta superar este monto."
                      >
                        <NumericInput value={trigger} onChange={setTrigger} min={0} step={10} />
                      </Field>

                      <Field
                        label="Bonus Trifecta (%)"
                        hint="0 = sin bonus. 20 = 20% extra en trifecta."
                      >
                        <NumericInput value={bonusRate} onChange={setBonusRate} min={0} max={200} step={1} />
                      </Field>
                    </div>

                    {/* Preview badge */}
                    <div className="flex items-center gap-3 rounded-lg bg-secondary border border-border px-4 py-2">
                      <span className="text-xl font-black text-accent">+{bonusRate}%</span>
                      <span className="text-xs text-muted">bonus en premios de Trifecta para {selectedPool.agency?.name ?? 'esta agencia'}</span>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <SaveButton loading={savingAgency} onClick={saveAgencyConfig} />
                      <button
                        type="button"
                        disabled={resettingAgency}
                        onClick={doResetAgencyPool}
                        className="rounded-lg border border-red-500 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50 cursor-pointer"
                      >
                        {resettingAgency ? 'Reiniciando...' : 'Reiniciar pozo'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
