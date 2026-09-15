import Constants from "expo-constants";

/**
 * Small typed fetch wrapper for the WashRewards Laravel API (Sanctum bearer auth).
 * Base URL comes from app.config.ts's extra.apiBaseUrl, itself driven by
 * EXPO_PUBLIC_API_BASE_URL at build/start time.
 */

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://api.washrewards.online/api";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path}`
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, query } = opts;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(
      "Network request failed — the server may be unreachable.",
      0,
      e
    );
  }

  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!res.ok) {
    const message =
      (json as { message?: string } | null)?.message ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, json);
  }

  return json as T;
}

// ---------- Domain types ----------

export interface User {
  id: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
  is_admin?: boolean;
  tenants?: Tenant[];
}

export interface Tenant {
  id: number | string;
  name: string;
  area?: string;
  address?: string;
  rating?: number;
  review_count?: number;
  distance_km?: number;
  price_from?: number;
  lat?: number;
  lng?: number;
  photo_url?: string | null;
  open_now?: boolean;
  services?: Service[];
}

export interface Vehicle {
  id: number | string;
  name: string;
  plate: string;
  make?: string;
  model?: string;
}

export interface Service {
  id: number | string;
  tenant_id?: number | string;
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  popular?: boolean;
}

export interface Booking {
  id: number | string;
  tenant_id: number | string;
  vehicle_id: number | string;
  service_id: number | string;
  scheduled_at: string;
  status: string;
  price?: number;
  tenant?: Tenant;
  service?: Service;
}

export interface WalletVoucher {
  id: number | string;
  name: string;
  desc: string;
  value: string;
  qr_token: string;
  expiry: string;
}

export interface LevelRow {
  n: number;
  name: string;
  reward: string;
  current?: boolean;
  achieved?: boolean;
}

export interface LoyaltySummary {
  tier: { level: number; name: string; reward_description: string };
  month_washes: number;
  next_threshold: number;
  level_pct: number;
  level_rows: LevelRow[];
  wallet: WalletVoucher[];
  wallet_total: number;
  wash_count?: number;
  wash_target?: number;
}

export interface NotificationItem {
  id: number | string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface PartnerDashboard {
  revenue_this_month: number;
  today_bookings_count: number;
  today_bookings_upcoming: number;
  customers_this_month: number;
  rating_avg: number;
  rating_count: number;
}

export interface PlatformDashboard {
  commission_this_month: number;
  active_partners: number;
  gross_bookings_this_month: number;
  bookings_per_month: number;
  avg_commission_per_partner: number;
}

// ---------- API surface ----------

export const api = {
  auth: {
    requestOtp: (phone: string) =>
      request<{ message: string }>("/auth/otp/request", {
        method: "POST",
        body: { phone },
      }),
    verifyOtp: (phone: string, code: string) =>
      request<{ user: User; token: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone, code },
      }),
    register: (payload: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      password_confirmation: string;
    }) =>
      request<{ user: User; token: string }>("/auth/register", {
        method: "POST",
        body: payload,
      }),
    login: (email: string, password: string) =>
      request<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    logout: (token: string) =>
      request<{ message: string }>("/auth/logout", { method: "POST", token }),
    me: (token: string) => request<User>("/auth/me", { token }),
  },

  tenants: {
    list: (token: string | null, lat?: number, lng?: number) =>
      request<Tenant[]>("/tenants", { token, query: { lat, lng } }),
    get: (token: string | null, id: string | number) =>
      request<Tenant>(`/tenants/${id}`, { token }),
  },

  vehicles: {
    list: (token: string) => request<Vehicle[]>("/vehicles", { token }),
    create: (token: string, payload: Partial<Vehicle>) =>
      request<Vehicle>("/vehicles", { method: "POST", token, body: payload }),
  },

  bookings: {
    list: (token: string) => request<Booking[]>("/bookings", { token }),
    get: (token: string, id: string | number) =>
      request<Booking>(`/bookings/${id}`, { token }),
    create: (
      token: string,
      payload: {
        tenant_id: string | number;
        vehicle_id: string | number;
        service_id: string | number;
        scheduled_at: string;
      }
    ) => request<Booking>("/bookings", { method: "POST", token, body: payload }),
    cancel: (token: string, id: string | number) =>
      request<Booking>(`/bookings/${id}/cancel`, { method: "POST", token }),
    pay: (token: string, id: string | number, payload: { payload: unknown }) =>
      request<{ booking: Booking; voucher_earned?: WalletVoucher }>(
        `/bookings/${id}/pay`,
        { method: "POST", token, body: payload }
      ),
    review: (
      token: string,
      id: string | number,
      payload: {
        rating: number;
        cleanliness: number;
        staff: number;
        value: number;
        wait_time: number;
        comment?: string;
      }
    ) =>
      request<{ message: string }>(`/bookings/${id}/review`, {
        method: "POST",
        token,
        body: payload,
      }),
  },

  loyalty: {
    summary: (token: string) =>
      request<LoyaltySummary>("/loyalty/summary", { token }),
  },

  vouchers: {
    list: (token: string) => request<WalletVoucher[]>("/vouchers", { token }),
    redeem: (token: string, id: string | number) =>
      request<{ message: string }>(`/vouchers/${id}/redeem`, {
        method: "POST",
        token,
      }),
  },

  notifications: {
    list: (token: string) =>
      request<NotificationItem[]>("/notifications", { token }),
    markRead: (token: string, id: string | number) =>
      request<{ message: string }>(`/notifications/${id}/read`, {
        method: "POST",
        token,
      }),
    markAllRead: (token: string) =>
      request<{ message: string }>("/notifications/read-all", {
        method: "POST",
        token,
      }),
  },

  partner: {
    dashboard: (token: string) =>
      request<PartnerDashboard>("/partner/dashboard", { token }),
    bookings: (token: string) =>
      request<Booking[]>("/partner/bookings", { token }),
    booking: (token: string, id: string | number) =>
      request<Booking>(`/partner/bookings/${id}`, { token }),
    advanceBooking: (token: string, id: string | number) =>
      request<Booking>(`/partner/bookings/${id}/advance`, {
        method: "POST",
        token,
      }),
    services: (token: string) =>
      request<Service[]>("/partner/services", { token }),
    createService: (token: string, payload: Partial<Service>) =>
      request<Service>("/partner/services", {
        method: "POST",
        token,
        body: payload,
      }),
    updateService: (token: string, id: string | number, payload: Partial<Service>) =>
      request<Service>(`/partner/services/${id}`, {
        method: "PUT",
        token,
        body: payload,
      }),
    deleteService: (token: string, id: string | number) =>
      request<{ message: string }>(`/partner/services/${id}`, {
        method: "DELETE",
        token,
      }),
    promotions: (token: string) => request<unknown[]>("/partner/promotions", { token }),
    redeemVoucher: (
      token: string,
      payload: { qr_token: string; booking_id?: string | number }
    ) =>
      request<{ message: string }>("/partner/vouchers/redeem", {
        method: "POST",
        token,
        body: payload,
      }),
  },

  platform: {
    dashboard: (token: string) =>
      request<PlatformDashboard>("/platform/dashboard", { token }),
  },
};
