export type Role = 'ADMIN' | 'OWNER' | 'CASHIER';

export interface GameConfig {
  x2Enabled: boolean;
}

export interface AgencyJackpotPool {
  id: string;
  agencyId: string;
  currentAmount: string;
  contributionRate: string;
  triggerMinAmount: string;
  trifectaBonusRate: string;
  x2Enabled: boolean;
  x2Probability: string;
  totalContributed: string;
  totalAwarded: string;
  lastAwardedAt: string | null;
  lastAwardedRaceId: string | null;
  updatedAt: string;
  agency?: { id: string; name: string; code: string };
}

export interface Agency {
  id: string;
  name: string;
  code: string;
  active: boolean;
  ownerId: string | null;
  owner?: { id: string; username: string; email: string | null } | null;
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
