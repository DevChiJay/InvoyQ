export interface ClientOut {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface ClientCreate {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ClientUpdate extends Partial<ClientCreate> {}

export interface ClientStats {
  total_count: number;
}

export interface ClientStatsResponse {
  stats: ClientStats;
}
