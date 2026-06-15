export type Role = 'ADMIN' | 'CASHIER';

export interface Agency {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  agencyId: string | null;
  createdAt: string;
  updatedAt: string;
  agency: Pick<Agency, 'id' | 'name' | 'code' | 'active'> | null;
}

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  agencyId: string | null;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export type TicketStatus = 'PENDING' | 'WON' | 'LOST' | 'PAID' | 'CANCELLED';

export type BetType = 'WINNER' | 'EXACTA' | 'TRIFECTA';

export interface TicketDetail {
  id: string;
  betType: BetType;
  selection: string;
  amount: string;
  odds: string;
  potentialPrize: string;
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  totalAmount: string;
  prizeAmount: string;
  status: TicketStatus;
  createdAt: string;
  details: TicketDetail[];
  race: {
    id: string;
    numero: number;
  };
  user: {
    id: string;
    username: string;
    email: string | null;
    role: Role;
    agencyId: string | null;
  };
}
