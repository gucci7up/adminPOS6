import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import type { GameConfig } from '../types';

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

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-primary p-6 flex flex-col gap-5">
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

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
    >
      {loading ? 'Guardando...' : 'Guardar'}
    </button>
  );
}

export default function ConfigPage() {
  const { toasts, add } = useToasts();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GameConfig | null>(null);

  // JACKPOT form state
  const [contribution, setContribution] = useState('');
  const [trigger, setTrigger] = useState('');
  const [savingJackpot, setSavingJackpot] = useState(false);
  const [resetting, setResetting] = useState(false);

  // BONUS form state
  const [bonusRate, setBonusRate] = useState('');
  const [savingBonus, setSavingBonus] = useState(false);

  // X2 form state
  const [x2Enabled, setX2Enabled] = useState(true);
  const [savingX2, setSavingX2] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.getGameConfig();
      setConfig(data);
      setContribution((parseFloat(data.contributionRate) * 100).toFixed(2));
      setTrigger(parseFloat(data.triggerMinAmount).toFixed(2));
      setBonusRate((parseFloat(data.trifectaBonusRate) * 100).toFixed(0));
      setX2Enabled(data.x2Enabled);
    } catch {
      add('Error cargando configuración', false);
    } finally {
      setLoading(false);
    }
  }, [add]);

  useEffect(() => { load(); }, [load]);

  async function saveJackpot() {
    setSavingJackpot(true);
    try {
      await apiClient.updateGameConfig({
        contributionRate: parseFloat(contribution) / 100,
        triggerMinAmount: parseFloat(trigger),
      });
      await load();
      add('Configuración del Jackpot guardada', true);
    } catch (e: unknown) {
      add(e instanceof Error ? e.message : 'Error al guardar', false);
    } finally {
      setSavingJackpot(false);
    }
  }

  async function resetPool() {
    if (!confirm('¿Reiniciar el pozo del Jackpot a $0.00?')) return;
    setResetting(true);
    try {
      await apiClient.resetJackpot();
      await load();
      add('Pozo reiniciado a $0.00', true);
    } catch (e: unknown) {
      add(e instanceof Error ? e.message : 'Error al reiniciar', false);
    } finally {
      setResetting(false);
    }
  }

  async function saveBonus() {
    setSavingBonus(true);
    try {
      await apiClient.updateGameConfig({ trifectaBonusRate: parseFloat(bonusRate) / 100 });
      await load();
      add('Bonus de Trifecta guardado', true);
    } catch (e: unknown) {
      add(e instanceof Error ? e.message : 'Error al guardar', false);
    } finally {
      setSavingBonus(false);
    }
  }

  async function saveX2() {
    setSavingX2(true);
    try {
      await apiClient.updateGameConfig({ x2Enabled });
      await load();
      add(`X2 ${x2Enabled ? 'activado' : 'desactivado'}`, true);
    } catch (e: unknown) {
      add(e instanceof Error ? e.message : 'Error al guardar', false);
    } finally {
      setSavingX2(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted animate-pulse">Cargando configuración...</p>
      </div>
    );
  }

  const poolAmount = config ? parseFloat(config.currentAmount).toFixed(2) : '0.00';
  const totalContrib = config ? parseFloat(config.totalContributed).toFixed(2) : '0.00';
  const totalAwarded = config ? parseFloat(config.totalAwarded).toFixed(2) : '0.00';
  const lastAward = config?.lastAwardedAt
    ? new Date(config.lastAwardedAt).toLocaleString('es-DO')
    : 'Nunca';

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
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

      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración del Juego</h1>
        <p className="mt-1 text-sm text-muted">
          Ajusta los parámetros de Jackpot, Bonus y X2 en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── JACKPOT ─────────────────────────────────────── */}
        <SectionCard title="Jackpot Progresivo" icon="💰">
          {/* Live stats */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-secondary p-4">
            <Stat label="Pozo actual" value={`$${poolAmount}`} accent />
            <Stat label="Último premio" value={lastAward} small />
            <Stat label="Total contribuido" value={`$${totalContrib}`} />
            <Stat label="Total pagado" value={`$${totalAwarded}`} />
          </div>

          <Field
            label="Contribución por ticket (%)"
            hint="% del monto total de cada ticket que va al pozo. Ej.: 1 = 1%"
          >
            <NumericInput value={contribution} onChange={setContribution} min={0} max={10} step={0.1} />
          </Field>

          <Field
            label="Mínimo para activar ($)"
            hint="El jackpot no puede caer hasta que el pozo supere este monto."
          >
            <NumericInput value={trigger} onChange={setTrigger} min={0} step={10} />
          </Field>

          <div className="flex gap-3 flex-wrap">
            <SaveButton loading={savingJackpot} onClick={saveJackpot} />
            <button
              type="button"
              disabled={resetting}
              onClick={resetPool}
              className="mt-2 rounded-lg border border-red-500 px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              {resetting ? 'Reiniciando...' : 'Reiniciar pozo'}
            </button>
          </div>

          {/* Probability reference */}
          <details className="text-xs text-muted">
            <summary className="cursor-pointer hover:text-foreground">Ver tabla de probabilidad</summary>
            <div className="mt-2 space-y-1 pl-1">
              <ProbRow label={`≥ $${trigger} (1×)`} pct="0%" />
              <ProbRow label={`$${(parseFloat(trigger || '0') * 2).toFixed(0)} (2×)`} pct="10%" />
              <ProbRow label={`$${(parseFloat(trigger || '0') * 5).toFixed(0)} (5×)`} pct="40%" />
              <ProbRow label={`$${(parseFloat(trigger || '0') * 10).toFixed(0)} (10×)`} pct="90%" />
              <ProbRow label="Máximo" pct="95%" />
            </div>
          </details>
        </SectionCard>

        {/* ── BONUS ───────────────────────────────────────── */}
        <SectionCard title="Bonus Trifecta" icon="🎯">
          <div className="rounded-lg border border-border bg-secondary p-4">
            <p className="text-sm text-muted">
              Se aplica automáticamente cuando un jugador acierta la{' '}
              <span className="text-accent font-semibold">Trifecta exacta</span>{' '}
              (1°, 2° y 3° en orden). El premio se multiplica por{' '}
              <span className="text-foreground font-bold">(1 + bonus%)</span>.
            </p>
            <p className="mt-2 text-xs text-muted opacity-70">
              Ejemplo: apuesta $100, cuota suma 9.00, bonus 20% → $100 × 9.00 × 1.20 = <strong>$1,080</strong>
            </p>
          </div>

          <Field
            label="Porcentaje de bonus (%)"
            hint="0 = sin bonus. 20 = 20% extra sobre la ganancia de trifecta."
          >
            <NumericInput value={bonusRate} onChange={setBonusRate} min={0} max={100} step={1} />
          </Field>

          {/* Visual preview */}
          <div className="flex items-center gap-3 rounded-lg bg-secondary border border-border px-4 py-3">
            <span className="text-2xl font-black text-accent">+{bonusRate}%</span>
            <span className="text-sm text-muted">
              en premios de Trifecta
            </span>
          </div>

          <SaveButton loading={savingBonus} onClick={saveBonus} />
        </SectionCard>

        {/* ── X2 ──────────────────────────────────────────── */}
        <SectionCard title="Multiplicador X2" icon="⚡">
          <div className="rounded-lg border border-border bg-secondary p-4">
            <p className="text-sm text-muted">
              Al <span className="text-accent font-semibold">cerrar la venta</span> de cada carrera,
              el sistema asigna aleatoriamente un perro (1–6) que recibe cuota doble.
              Aplica a apuestas de tipo GANAR, EXACTA y TRIFECTA que incluyan ese perro.
            </p>
            <p className="mt-2 text-xs text-muted opacity-70">
              Ejemplo: perro 3 tiene cuota 4.00 → con X2 se liquida como 8.00.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Estado del X2</p>
              <p className="text-xs text-muted">{x2Enabled ? 'Activo — se asigna en cada carrera' : 'Inactivo — no se asigna X2'}</p>
            </div>
            <Toggle checked={x2Enabled} onChange={setX2Enabled} />
          </div>

          {/* X2 assignment flow */}
          <div className="rounded-lg border border-border p-3 text-xs text-muted space-y-1">
            <p className="font-semibold text-foreground mb-1">Flujo del X2</p>
            <Step n={1} text="Carrera ABIERTA — jugadores apuestan normalmente" />
            <Step n={2} text="Venta CERRADA — sistema sortea perro X2 (1 de 6)" />
            <Step n={3} text="POS muestra badge naranja «X2 Perro N»" />
            <Step n={4} text="Carrera corre — si el perro X2 gana, su cuota se duplica en la liquidación" />
          </div>

          <SaveButton loading={savingX2} onClick={saveX2} />
        </SectionCard>

      </div>
    </div>
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

function ProbRow({ label, pct }: { label: string; pct: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className="font-bold text-accent">{pct}</span>
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
