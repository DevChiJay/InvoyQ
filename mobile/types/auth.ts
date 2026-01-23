export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserRead {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_pro: boolean;
  subscription_status: string | null;
  avatar_url: string | null;
  phone: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  company_address: string | null;
  tax_id: string | null;
  website: string | null;
}

export interface LoginRequest {
  username: string; // email
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  company_name?: string;
  company_address?: string;
  tax_id?: string;
  website?: string;
}

export interface UserBusinessInfo {
  full_name: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  company_address: string | null;
  tax_id: string | null;
  phone: string | null;
  email: string;
}
