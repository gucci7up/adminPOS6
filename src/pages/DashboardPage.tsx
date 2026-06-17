import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import type { Agency, AgencyJackpotPool, Ticket } from '../types';

const fmt = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface AgencyStat {
  id: string;
  name: string;
  code: string;
  active: boolean;
  totalApostado: number;
  totalPagado: number;
  balance: number;
  tickets: number;
  jackpot: number;
  dailyAmounts: number[];
}

function buildStats(agencies: Agency[], tickets: Ticket[], pools: AgencyJackpotPool[]): AgencyStat[] {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });

  return agencies
    .map((agency) => {
      const ats = tickets.filter((t) => t.user.agencyId === agency.id);
      const pool = pools.find((p) => p.agencyId === agency.id);
      const totalApostado = ats.reduce((s, t) => s + Number(t.totalAmount), 0);
      const totalPagado = ats.reduce((s, t) => s + Number(t.prizeAmount), 0);
      const dailyAmounts = days.map((day) =>
        ats
          .filter((t) => new Date(t.createdAt).toDateString() === day)
          .reduce((s, t) => s + Number(t.totalAmount), 0),
      );
      return {
        id: agency.id,
        name: agency.name,
        code: agency.code,
        active: agency.active,
        totalApostado,
        totalPagado,
        balance: totalApostado - totalPagado,
        tickets: ats.length,
        jackpot: Number(pool?.currentAmount ?? 0),
        dailyAmounts,
      };
    })
    .sort((a, b) => b.totalApostado - a.totalApostado);
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const safeData = data.length > 1 ? data : [0, 0, 1, 0, 1, 2, 1];
  const max = Math.max(...safeData, 0.01);
  const min = Math.min(...safeData);
  const range = max - min || 0.01;
  const W = 120;
  const H = 44;

  const points = safeData.map((v, i) => ({
    x: (i / (safeData.length - 1)) * W,
    y: H - ((v - min) / range) * (H * 0.75) - H * 0.1,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillD = `${pathD} L${W},${H} L0,${H} Z`;
  const color = positive ? '#22C55E' : '#EF4444';
  const fillColor = positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-11" preserveAspectRatio="none">
      <path d={fillD} fill={fillColor} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {points.at(-1) && (
        <circle cx={points.at(-1)!.x} cy={points.at(-1)!.y} r="2.5" fill={color} />
      )}
    </svg>
  );
}

function AgencyAvatar({ code, size = 'md' }: { code: string; size?: 'sm' | 'md' }) {
  const label = code.slice(0, 2).toUpperCase();
  const cls = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-10 w-10 text-sm';
  return (
    <div className={`${cls} rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0`}>
      <span className="text-accent font-black">{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pools, setPools] = useState<AgencyJackpotPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt] = useState(new Date());

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ag, tk, pl] = await Promise.all([
          apiClient.getAgencies(),
          apiClient.getTickets(),
          apiClient.getAllAgencyPools(),
        ]);
        setAgencies(ag);
        setTickets(tk);
        setPools(pl);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => buildStats(agencies, tickets, pools), [agencies, tickets, pools]);

  const today = new Date().toDateString();
  const todayTickets = tickets.filter((t) => new Date(t.createdAt).toDateString() === today);
  const totalApostadoHoy = todayTickets.reduce((s, t) => s + Number(t.totalAmount), 0);
  const totalPagadoHoy = todayTickets.reduce((s, t) => s + Number(t.prizeAmount), 0);
  const balanceHoy = totalApostadoHoy - totalPagadoHoy;
  const totalJackpot = pools.reduce((s, p) => s + Number(p.currentAmount), 0);

  const tickerItems = [
    { label: 'Agencias activas', value: agencies.filter((a) => a.active).length.toString() },
    { label: 'Tickets hoy', value: todayTickets.length.toString() },
    { label: 'Apostado hoy', value: fmt.format(totalApostadoHoy) },
    { label: 'Pagado hoy', value: fmt.format(totalPagadoHoy) },
    { label: 'Balance hoy', value: fmt.format(balanceHoy), positive: balanceHoy >= 0 },
    { label: 'Jackpot total', value: fmt.format(totalJackpot), positive: true },
    { label: 'Total agencias', value: agencies.length.toString() },
    { label: 'Total tickets', value: tickets.length.toString() },
  ];

  const minsAgo = Math.floor((Date.now() - loadedAt.getTime()) / 60000);
  const updateLabel = minsAgo === 0 ? 'justo ahora' : `hace ${minsAgo} min`;

  const top2 = stats.slice(0, 2);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col -m-4 md:-m-8 min-h-full">

      {/* ── Ticker bar ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-b border-border bg-primary">
        <div className="flex items-center gap-0 overflow-x-auto py-2.5 px-4" style={{ scrollbarWidth: 'none' }}>
          {tickerItems.map((item, i) => (
            <span key={i} className="flex items-center gap-0 whitespace-nowrap flex-shrink-0">
              <span className="text-xs text-muted">{item.label}</span>
              <span className={`text-xs font-bold tabular-nums ml-2 ${
                'positive' in item
                  ? item.positive ? 'text-positive' : 'text-destructive'
                  : 'text-foreground'
              }`}>{item.value}</span>
              {i < tickerItems.length - 1 && (
                <span className="mx-5 text-border select-none">|</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 flex flex-col gap-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-positive" style={{ boxShadow: '0 0 6px #22C55E' }} />
            <span className="text-xs text-muted">
              Última actualización: <span className="font-semibold text-foreground">{updateLabel}</span>
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground leading-tight">
            Resumen en Vivo
          </h1>
          <p className="text-sm text-muted mt-1">Panel de control en tiempo real — Racing Dogs</p>
        </div>

        {/* ── KPI cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Tickets hoy',
              value: todayTickets.length.toString(),
              sub: 'boletos vendidos',
              tone: null,
            },
            {
              label: 'Apostado hoy',
              value: fmt.format(totalApostadoHoy),
              sub: 'en ventas del día',
              tone: null,
            },
            {
              label: 'Balance hoy',
              value: fmt.format(balanceHoy),
              sub: balanceHoy >= 0 ? 'ganancia neta' : 'déficit',
              tone: balanceHoy >= 0 ? 'pos' : 'neg',
            },
            {
              label: 'Jackpot acumulado',
              value: fmt.format(totalJackpot),
              sub: 'en todos los pozos',
              tone: 'accent',
            },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-1">
              <p className="text-[11px] text-muted uppercase tracking-wider">{kpi.label}</p>
              <p className={`text-xl font-black tabular-nums leading-none mt-1 ${
                kpi.tone === 'pos' ? 'text-positive'
                : kpi.tone === 'neg' ? 'text-destructive'
                : kpi.tone === 'accent' ? 'text-accent'
                : 'text-foreground'
              }`}>{kpi.value}</p>
              <p className="text-[11px] text-muted">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Top agency cards ───────────────────────────────────────────── */}
        {top2.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {top2.map((ag) => {
              const pct = ag.totalApostado > 0
                ? ((ag.balance / ag.totalApostado) * 100).toFixed(2)
                : '0.00';
              const isPos = ag.balance >= 0;
              return (
                <div
                  key={ag.id}
                  className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4"
                  style={{ borderLeft: `3px solid ${isPos ? '#22C55E' : '#EF4444'}` }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <AgencyAvatar code={ag.code} />
                      <div>
                        <p className="text-[11px] text-muted">Agencia</p>
                        <p className="font-bold text-foreground text-sm leading-tight">{ag.name}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      ag.active ? 'bg-positive/15 text-positive' : 'bg-border text-muted'
                    }`}>
                      {ag.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-[11px] text-muted">Total apostado</p>
                    <p className="text-2xl font-black text-foreground tabular-nums mt-0.5">
                      {fmt.format(ag.totalApostado)}
                    </p>
                  </div>

                  {/* Badge row */}
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      isPos ? 'bg-positive/15 text-positive' : 'bg-destructive/15 text-destructive'
                    }`}>
                      {isPos ? '↑ +' : '↓ '}{pct}%
                    </span>
                    <span className="text-xs text-muted">{ag.tickets} tickets</span>
                    <span className="text-xs text-muted">|</span>
                    <span className="text-xs text-muted">Jackpot: {fmt.format(ag.jackpot)}</span>
                  </div>

                  {/* Sparkline */}
                  <Sparkline data={ag.dailyAmounts} positive={isPos} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Agency table ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <p className="text-xs text-muted uppercase tracking-wider">En vivo</p>
            </div>
            <h2 className="text-base font-bold text-foreground">Rendimiento por Agencia</h2>
          </div>

          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[11px] text-muted font-medium tracking-wider uppercase">No</th>
                  <th className="px-4 py-3 text-left text-[11px] text-muted font-medium tracking-wider uppercase">Agencia</th>
                  <th className="px-4 py-3 text-right text-[11px] text-muted font-medium tracking-wider uppercase">Apostado</th>
                  <th className="px-4 py-3 text-right text-[11px] text-muted font-medium tracking-wider uppercase hidden sm:table-cell">Pagado</th>
                  <th className="px-4 py-3 text-right text-[11px] text-muted font-medium tracking-wider uppercase">Balance</th>
                  <th className="px-4 py-3 text-right text-[11px] text-muted font-medium tracking-wider uppercase hidden md:table-cell">Tickets</th>
                </tr>
              </thead>
              <tbody>
                {stats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                      No hay datos de agencias disponibles.
                    </td>
                  </tr>
                ) : (
                  stats.map((ag, i) => {
                    const pct = ag.totalApostado > 0
                      ? ((ag.balance / ag.totalApostado) * 100).toFixed(2)
                      : '0.00';
                    const isPos = ag.balance >= 0;
                    return (
                      <tr key={ag.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-3.5 text-muted text-xs font-mono">#{i + 1}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <AgencyAvatar code={ag.code} size="sm" />
                            <div>
                              <p className="font-semibold text-foreground text-sm leading-none">{ag.name}</p>
                              <p className="text-[11px] text-muted mt-0.5">{ag.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-foreground">
                          {fmt.format(ag.totalApostado)}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-muted hidden sm:table-cell">
                          {fmt.format(ag.totalPagado)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isPos ? 'bg-positive/15 text-positive' : 'bg-destructive/15 text-destructive'
                          }`}>
                            {isPos ? '+' : ''}{pct}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-muted hidden md:table-cell">
                          {ag.tickets}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
