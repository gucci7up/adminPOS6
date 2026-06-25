import type { Agency, AgencyJackpotPool, AuthResult, GameConfig, Ticket, User } from '../types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://api.mbsport.lat';

export class ApiException extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
  }
}

function extractErrorMessage(decoded: unknown): string {
  if (decoded && typeof decoded === 'object' && 'message' in decoded) {
    const message = (decoded as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.length > 0) return message.join('\n');
  }
  return 'Error de comunicación con el servidor';
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const decoded = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new ApiException(extractErrorMessage(decoded), response.status);
    }

    return decoded as T;
  }

  async login(username: string, password: string): Promise<AuthResult> {
    const result = await this.request<AuthResult>('POST', '/auth/login', { username, password });
    this.setToken(result.accessToken);
    return result;
  }

  getAgencies() {
    return this.request<Agency[]>('GET', '/agencies');
  }

  createAgency(data: { name: string; code: string; active?: boolean }) {
    return this.request<Agency>('POST', '/agencies', data);
  }

  updateAgency(id: string, data: Partial<{ name: string; code: string; active: boolean }>) {
    return this.request<Agency>('PATCH', `/agencies/${id}`, data);
  }

  deleteAgency(id: string) {
    return this.request<void>('DELETE', `/agencies/${id}`);
  }

  getUsers() {
    return this.request<User[]>('GET', '/users');
  }

  registerUser(data: { username: string; name?: string; password: string; email?: string; role?: 'CASHIER' | 'OWNER' }) {
    return this.request<{ user: User; accessToken: string }>('POST', '/auth/register', data);
  }

  updateUserProfile(userId: string, data: { name?: string; email?: string }) {
    return this.request<User>('PATCH', `/users/${userId}`, data);
  }

  updateUserPassword(userId: string, password: string) {
    return this.request<{ ok: boolean }>('PATCH', `/users/${userId}/password`, { password });
  }

  deleteUser(userId: string) {
    return this.request<{ ok: boolean }>('DELETE', `/users/${userId}`);
  }

  assignUserAgency(userId: string, agencyId: string) {
    return this.request<User>('PATCH', `/users/${userId}/agency`, { agencyId });
  }

  makeAdmin(userId: string) {
    return this.request<User>('POST', `/users/${userId}/make-admin`);
  }

  makeOwner(userId: string) {
    return this.request<User>('POST', `/users/${userId}/make-owner`);
  }

  assignAgencyOwner(agencyId: string, ownerId: string | null) {
    return this.request<Agency>('POST', `/agencies/${agencyId}/assign-owner`, { ownerId });
  }

  getTickets() {
    return this.request<Ticket[]>('GET', '/tickets');
  }

  getCancelledToday() {
    return this.request<{ count: number; totalAmount: number; tickets: any[] }>('GET', '/tickets/cancelled/today');
  }

  cancelTicket(ticketId: string) {
    return this.request<{ ok: boolean }>('POST', `/tickets/${ticketId}/cancel`, { reason: 'Anulado por administrador' });
  }

  getGlobalConfig() {
    return this.request<GameConfig>('GET', '/jackpot/global');
  }

  updateGlobalConfig(data: { x2Enabled?: boolean }) {
    return this.request<GameConfig>('POST', '/jackpot/global/config', data);
  }

  getAllAgencyPools() {
    return this.request<AgencyJackpotPool[]>('GET', '/jackpot/agencies');
  }

  getAgencyPool(agencyId: string) {
    return this.request<AgencyJackpotPool>('GET', `/jackpot/agencies/${agencyId}`);
  }

  updateAgencyConfig(agencyId: string, data: { contributionRate?: number; triggerMinAmount?: number; trifectaBonusRate?: number; x2Enabled?: boolean; x2Probability?: number }) {
    return this.request<AgencyJackpotPool>('POST', `/jackpot/agencies/${agencyId}/config`, data);
  }

  resetAgencyPool(agencyId: string) {
    return this.request<{ agencyId: string; currentAmount: string }>('POST', `/jackpot/agencies/${agencyId}/reset`);
  }
}

export const apiClient = new ApiClient();
