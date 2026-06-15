import { useEffect, useState } from 'react';
import { apiClient, ApiException } from '../api/client';
import type { Agency, Ticket } from '../types';

interface AgencyTotals {
  agencyId: string | null;
  agencyName: string;
  totalApostado: number;
  totalPagado: number;
  balance: number;
  ticketCount: number;
}

const currencyFormatter = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
});

export default function ReportsPage() {
  const [rows, setRows] = useState<AgencyTotals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [agencies, tickets] = await Promise.all([apiClient.getAgencies(), apiClient.getTickets()]);
        setRows(buildReport(agencies, tickets));
        setError(null);
      } catch (err) {
        setError(err instanceof ApiException ? err.message : 'No se pudo conectar con el servidor.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const grandTotal = rows.reduce(
    (acc, row) => ({
      totalApostado: acc.totalApostado + row.totalApostado,
      totalPagado: acc.totalPagado + row.totalPagado,
      balance: acc.balance + row.balance,
      ticketCount: acc.ticketCount + row.ticketCount,
    }),
    { totalApostado: 0, totalPagado: 0, balance: 0, ticketCount: 0 },
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reportes por agencia</h1>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total apostado" value={currencyFormatter.format(grandTotal.totalApostado)} />
        <KpiCard label="Total pagado" value={currencyFormatter.format(grandTotal.totalPagado)} />
        <KpiCard
          label="Balance"
          value={currencyFormatter.format(grandTotal.balance)}
          tone={grandTotal.balance >= 0 ? 'positive' : 'destructive'}
        />
        <KpiCard label="Tickets" value={grandTotal.ticketCount.toString()} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Agencia</th>
              <th className="px-4 py-3 font-medium text-right">Total apostado</th>
              <th className="px-4 py-3 font-medium text-right">Total pagado</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-right">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No hay tickets registrados.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildReport(agencies: Agency[], tickets: Ticket[]): AgencyTotals[] {
  const agencyNames = new Map(agencies.map((a) => [a.id, a.name]));
  const totals = new Map<string | null, AgencyTotals>();

  for (const ticket of tickets) {
    const agencyId = ticket.user.agencyId ?? null;
    const key = agencyId;
    if (!totals.has(key)) {
      totals.set(key, {
        agencyId,
        agencyName: agencyId ? agencyNames.get(agencyId) ?? 'Agencia desconocida' : 'Sin agencia',
        totalApostado: 0,
        totalPagado: 0,
        balance: 0,
        ticketCount: 0,
      });
    }
    const row = totals.get(key)!;
    const amount = Number(ticket.totalAmount);
    const prize = Number(ticket.prizeAmount);
    row.totalApostado += amount;
    row.totalPagado += prize;
    row.balance += amount - prize;
    row.ticketCount += 1;
  }

  return Array.from(totals.values()).sort((a, b) => b.totalApostado - a.totalApostado);
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
