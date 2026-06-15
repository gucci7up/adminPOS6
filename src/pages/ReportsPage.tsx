import { Fragment, useEffect, useMemo, useState } from 'react';
import { apiClient, ApiException } from '../api/client';
import type { Agency, BetType, Ticket, TicketStatus } from '../types';

interface AgencyTotals {
  agencyId: string | null;
  agencyName: string;
  totalApostado: number;
  totalPagado: number;
  balance: number;
  ticketCount: number;
  jugadas: number;
}

type GroupBy = 'day' | 'week' | 'month';

const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'short' });
const dateTimeFormatter = new Intl.DateTimeFormat('es-DO', { dateStyle: 'short', timeStyle: 'short' });

const STATUS_LABELS: Record<TicketStatus, string> = {
  PENDING: 'Pendiente',
  WON: 'Ganado',
  LOST: 'Perdido',
  PAID: 'Pagado',
  CANCELLED: 'Anulado',
};

const BET_TYPE_LABELS: Record<BetType, string> = {
  WINNER: 'Ganador',
  EXACTA: 'Exacta',
  TRIFECTA: 'Trifecta',
};

export default function ReportsPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [agenciesData, ticketsData] = await Promise.all([apiClient.getAgencies(), apiClient.getTickets()]);
        setAgencies(agenciesData);
        setTickets(ticketsData);
        setError(null);
      } catch (err) {
        setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredTickets = useMemo(() => {
    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59.999`) : null;

    return tickets.filter((ticket) => {
      if (agencyFilter !== 'all') {
        const ticketAgencyId = ticket.user.agencyId ?? 'sin-agencia';
        if (ticketAgencyId !== agencyFilter) return false;
      }
      const createdAt = new Date(ticket.createdAt);
      if (fromDate && createdAt < fromDate) return false;
      if (toDate && createdAt > toDate) return false;
      return true;
    });
  }, [tickets, agencyFilter, from, to]);

  const agencyTotals = useMemo(() => buildAgencyTotals(agencies, filteredTickets), [agencies, filteredTickets]);

  const grandTotal = useMemo(
    () =>
      agencyTotals.reduce(
        (acc, row) => ({
          totalApostado: acc.totalApostado + row.totalApostado,
          totalPagado: acc.totalPagado + row.totalPagado,
          balance: acc.balance + row.balance,
          ticketCount: acc.ticketCount + row.ticketCount,
          jugadas: acc.jugadas + row.jugadas,
        }),
        { totalApostado: 0, totalPagado: 0, balance: 0, ticketCount: 0, jugadas: 0 },
      ),
    [agencyTotals],
  );

  const periodRows = useMemo(
    () => buildPeriodReport(agencies, filteredTickets, groupBy),
    [agencies, filteredTickets, groupBy],
  );

  const sortedTickets = useMemo(
    () => [...filteredTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [filteredTickets],
  );

  function setQuickRange(range: 'today' | 'week' | 'month' | 'all') {
    const now = new Date();
    if (range === 'all') {
      setFrom('');
      setTo('');
      return;
    }
    const todayStr = toDateInputValue(now);
    if (range === 'today') {
      setFrom(todayStr);
      setTo(todayStr);
      return;
    }
    if (range === 'week') {
      setFrom(toDateInputValue(startOfWeek(now)));
      setTo(todayStr);
      return;
    }
    setFrom(toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
    setTo(todayStr);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Reportes por agencia</h1>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-primary cursor-pointer print:hidden"
        >
          Imprimir
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4 print:hidden">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Agencia</label>
          <select
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todas</option>
            {agencies.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {agency.name}
              </option>
            ))}
            <option value="sin-agencia">Sin agencia</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Agrupar por</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setQuickRange('today')} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary cursor-pointer">
            Hoy
          </button>
          <button type="button" onClick={() => setQuickRange('week')} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary cursor-pointer">
            Esta semana
          </button>
          <button type="button" onClick={() => setQuickRange('month')} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary cursor-pointer">
            Este mes
          </button>
          <button type="button" onClick={() => setQuickRange('all')} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary cursor-pointer">
            Todo
          </button>
        </div>
      </div>

      {/* Print header: range summary */}
      <div className="mb-4 hidden print:block">
        <p className="text-sm text-muted">
          Periodo: {from ? dateFormatter.format(new Date(`${from}T00:00:00`)) : 'inicio'} —{' '}
          {to ? dateFormatter.format(new Date(`${to}T00:00:00`)) : 'hoy'}
          {agencyFilter !== 'all' &&
            ` · Agencia: ${
              agencyFilter === 'sin-agencia' ? 'Sin agencia' : agencies.find((a) => a.id === agencyFilter)?.name ?? agencyFilter
            }`}
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total apostado" value={currencyFormatter.format(grandTotal.totalApostado)} />
        <KpiCard label="Total pagado" value={currencyFormatter.format(grandTotal.totalPagado)} />
        <KpiCard
          label="Balance"
          value={currencyFormatter.format(grandTotal.balance)}
          tone={grandTotal.balance >= 0 ? 'positive' : 'destructive'}
        />
        <KpiCard label="Tickets vendidos" value={grandTotal.ticketCount.toString()} />
        <KpiCard label="Jugadas" value={grandTotal.jugadas.toString()} />
      </div>

      {/* Agency summary */}
      <h2 className="mb-3 text-lg font-semibold">Totales por agencia</h2>
      <div className="mb-8 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Agencia</th>
              <th className="px-4 py-3 font-medium text-right">Total apostado</th>
              <th className="px-4 py-3 font-medium text-right">Total pagado</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-right">Tickets</th>
              <th className="px-4 py-3 font-medium text-right">Jugadas</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            ) : agencyTotals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  No hay tickets registrados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              agencyTotals.map((row) => (
                <tr key={row.agencyId ?? 'sin-agencia'} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{row.agencyName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{currencyFormatter.format(row.totalApostado)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{currencyFormatter.format(row.totalPagado)}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${
                      row.balance >= 0 ? 'text-positive' : 'text-destructive'
                    }`}
                  >
                    {currencyFormatter.format(row.balance)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.ticketCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.jugadas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Period breakdown */}
      <h2 className="mb-3 text-lg font-semibold">
        Totales por {groupBy === 'day' ? 'día' : groupBy === 'week' ? 'semana' : 'mes'}
      </h2>
      <div className="mb-8 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Periodo</th>
              <th className="px-4 py-3 font-medium">Agencia</th>
              <th className="px-4 py-3 font-medium text-right">Total apostado</th>
              <th className="px-4 py-3 font-medium text-right">Total pagado</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-right">Tickets</th>
              <th className="px-4 py-3 font-medium text-right">Jugadas</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            ) : periodRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  No hay tickets registrados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              periodRows.map((row) => (
                <tr key={`${row.periodKey}-${row.agencyId ?? 'sin-agencia'}`} className="border-b border-border last:border-0 hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{row.periodLabel}</td>
                  <td className="px-4 py-3">{row.agencyName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{currencyFormatter.format(row.totalApostado)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{currencyFormatter.format(row.totalPagado)}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${
                      row.balance >= 0 ? 'text-positive' : 'text-destructive'
                    }`}
                  >
                    {currencyFormatter.format(row.balance)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.ticketCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.jugadas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket detail */}
      <h2 className="mb-3 text-lg font-semibold">Detalle de tickets</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Agencia</th>
              <th className="px-4 py-3 font-medium">Cajero</th>
              <th className="px-4 py-3 font-medium text-right">Carrera</th>
              <th className="px-4 py-3 font-medium text-right">Jugadas</th>
              <th className="px-4 py-3 font-medium text-right">Apostado</th>
              <th className="px-4 py-3 font-medium text-right">Premio</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            ) : sortedTickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-muted">
                  No hay tickets registrados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              sortedTickets.map((ticket) => {
                const isExpanded = expandedTicketId === ticket.id;
                const agencyName = ticket.user.agencyId
                  ? agencies.find((a) => a.id === ticket.user.agencyId)?.name ?? 'Agencia desconocida'
                  : 'Sin agencia';
                return (
                  <Fragment key={ticket.id}>
                    <tr
                      onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50 print:cursor-default"
                    >
                      <td className="px-4 py-3 font-medium tabular-nums">#{ticket.ticketNumber}</td>
                      <td className="px-4 py-3 tabular-nums">{dateTimeFormatter.format(new Date(ticket.createdAt))}</td>
                      <td className="px-4 py-3">{agencyName}</td>
                      <td className="px-4 py-3">{ticket.user.username}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{ticket.race?.numero ?? '-'}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{ticket.details?.length ?? 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{currencyFormatter.format(Number(ticket.totalAmount))}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{currencyFormatter.format(Number(ticket.prizeAmount))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border bg-background/40 last:border-0">
                        <td colSpan={9} className="px-4 py-3">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-muted">
                                <th className="py-1 pr-4 font-medium">Tipo</th>
                                <th className="py-1 pr-4 font-medium">Selección</th>
                                <th className="py-1 pr-4 font-medium text-right">Monto</th>
                                <th className="py-1 pr-4 font-medium text-right">Cuota</th>
                                <th className="py-1 pr-4 font-medium text-right">Premio potencial</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(ticket.details ?? []).map((detail) => (
                                <tr key={detail.id}>
                                  <td className="py-1 pr-4">{BET_TYPE_LABELS[detail.betType] ?? detail.betType}</td>
                                  <td className="py-1 pr-4">{detail.selection}</td>
                                  <td className="py-1 pr-4 text-right tabular-nums">{currencyFormatter.format(Number(detail.amount))}</td>
                                  <td className="py-1 pr-4 text-right tabular-nums">{Number(detail.odds).toFixed(2)}</td>
                                  <td className="py-1 pr-4 text-right tabular-nums">{currencyFormatter.format(Number(detail.potentialPrize))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const toneClass =
    status === 'WON' || status === 'PAID'
      ? 'text-positive border-positive/40 bg-positive/10'
      : status === 'LOST' || status === 'CANCELLED'
        ? 'text-destructive border-destructive/40 bg-destructive/10'
        : 'text-muted border-border bg-secondary';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${toneClass}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'destructive' }) {
  const toneClass = tone === 'positive' ? 'text-positive' : tone === 'destructive' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

function emptyTotals(agencyId: string | null, agencyName: string): AgencyTotals {
  return { agencyId, agencyName, totalApostado: 0, totalPagado: 0, balance: 0, ticketCount: 0, jugadas: 0 };
}

function accumulate(row: AgencyTotals, ticket: Ticket) {
  const amount = Number(ticket.totalAmount);
  const prize = Number(ticket.prizeAmount);
  row.totalApostado += amount;
  row.totalPagado += prize;
  row.balance += amount - prize;
  row.ticketCount += 1;
  row.jugadas += ticket.details?.length ?? 0;
}

function buildAgencyTotals(agencies: Agency[], tickets: Ticket[]): AgencyTotals[] {
  const agencyNames = new Map(agencies.map((a) => [a.id, a.name]));
  const totals = new Map<string | null, AgencyTotals>();

  for (const ticket of tickets) {
    const agencyId = ticket.user.agencyId ?? null;
    if (!totals.has(agencyId)) {
      totals.set(
        agencyId,
        emptyTotals(agencyId, agencyId ? agencyNames.get(agencyId) ?? 'Agencia desconocida' : 'Sin agencia'),
      );
    }
    accumulate(totals.get(agencyId)!, ticket);
  }

  return Array.from(totals.values()).sort((a, b) => b.totalApostado - a.totalApostado);
}

interface PeriodRow extends AgencyTotals {
  periodKey: string;
  periodLabel: string;
}

function buildPeriodReport(agencies: Agency[], tickets: Ticket[], groupBy: GroupBy): PeriodRow[] {
  const agencyNames = new Map(agencies.map((a) => [a.id, a.name]));
  const totals = new Map<string, PeriodRow>();

  for (const ticket of tickets) {
    const agencyId = ticket.user.agencyId ?? null;
    const agencyName = agencyId ? agencyNames.get(agencyId) ?? 'Agencia desconocida' : 'Sin agencia';
    const { key: periodKey, label: periodLabel } = periodOf(new Date(ticket.createdAt), groupBy);
    const mapKey = `${periodKey}::${agencyId ?? 'sin-agencia'}`;

    if (!totals.has(mapKey)) {
      totals.set(mapKey, { ...emptyTotals(agencyId, agencyName), periodKey, periodLabel });
    }
    accumulate(totals.get(mapKey)!, ticket);
  }

  return Array.from(totals.values()).sort((a, b) => {
    if (a.periodKey !== b.periodKey) return b.periodKey.localeCompare(a.periodKey);
    return a.agencyName.localeCompare(b.agencyName);
  });
}

function periodOf(date: Date, groupBy: GroupBy): { key: string; label: string } {
  if (groupBy === 'month') {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });
    return { key, label: capitalize(label) };
  }

  if (groupBy === 'week') {
    const monday = startOfWeek(date);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const key = toDateInputValue(monday);
    const label = `${dateFormatter.format(monday)} - ${dateFormatter.format(sunday)}`;
    return { key, label };
  }

  const key = toDateInputValue(date);
  return { key, label: dateFormatter.format(date) };
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7; // días desde el lunes
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
