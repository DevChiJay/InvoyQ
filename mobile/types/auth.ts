export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Answers to "How did you hear about InvoyQ?" (mirrors backend ReferralSource) */
export const REFERRAL_SOURCES = [
  "instagram",
  "friend",
  "x",
  "linkedin",
  "app_store",
  "other",
] as const;
export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export type ReferralAnswer = {
  referral_source?: ReferralSource;
  referral_source_other?: string;
};

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
  oauth_provider: string | null; // 'google' if OAuth user
  has_password: boolean; // true if user has set a password
  referral_source?: ReferralSource | null; // null = not answered yet
  referral_source_other?: string | null;
}

export interface LoginRequest {
  username: string; // email
  password: string;
}

// The platform is sent as the X-Client-Platform header by the API client, not in the body.
export interface RegisterRequest extends ReferralAnswer {
  email: string;
  full_name: string;
  password: string;
}

export interface UserUpdate extends ReferralAnswer {
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
