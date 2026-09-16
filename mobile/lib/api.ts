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

/**
 * Laravel's default JsonResource/AnonymousResourceCollection behaviour wraps
 * every resource response in {"data": ...} (plus {"links","meta"} when
 * paginated) UNLESS the controller builds a plain array by hand — this
 * backend does both inconsistently across endpoints, so each API method
 * below picks request() or requestData() to match what its specific
 * endpoint actually returns (see each controller for the ground truth).
 */
async function requestData<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const json = await request<{ data: T }>(path, opts);
  return json.data;
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
  type?: "fixed_garage" | "mobile_wash";
  suburb?: string | null;
  city?: string | null;
  address?: string;
  rating_avg?: number;
  rating_count?: number;
  from_price?: number | null;
  distance_km?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  logo_url?: string | null;
  services?: Service[];
}

export interface Vehicle {
  id: number | string;
  name: string;
  plate: string;
  make?: string;
  model?: string;
  color?: string;
}

export interface Service {
  id: number | string;
  tenant_id?: number | string;
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  is_popular?: boolean;
}

export interface Booking {
  id: number | string;
  receipt_no?: string;
  scheduled_at: string;
  status: string;
  payment_status?: string;
  price?: number;
  total_amount?: number;
  has_review?: boolean | null;
  completed_at?: string | null;
  tenant?: Tenant;
  service?: Service;
  vehicle?: Vehicle;
}

// Matches App\Http\Resources\VoucherResource exactly — the backend has no
// "name"/"desc" concept, just a flat amount + where it came from.
export interface WalletVoucher {
  id: number | string;
  code: string;
  qr_token: string | null;
  amount: number;
  status: "active" | "redeemed" | "expired";
  source: "loyalty" | "promotion" | "admin_grant";
  earned_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
}

export interface LevelRow {
  level: number;
  name: string;
  reward_description: string;
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

export interface Promotion {
  id: number | string;
  title: string;
  description?: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  code?: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
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
    // GET /tenants is a paginated resource collection -> {data, links, meta}
    list: (token: string | null, lat?: number, lng?: number) =>
      requestData<Tenant[]>("/tenants", { token, query: { lat, lng } }),
    get: (token: string | null, id: string | number) =>
      requestData<Tenant>(`/tenants/${id}`, { token }),
  },

  vehicles: {
    list: (token: string) => requestData<Vehicle[]>("/vehicles", { token }),
    create: (token: string, payload: Partial<Vehicle>) =>
      requestData<Vehicle>("/vehicles", { method: "POST", token, body: payload }),
  },

  bookings: {
    // GET /bookings is a paginated resource collection -> {data, links, meta}
    list: (token: string) => requestData<Booking[]>("/bookings", { token }),
    get: (token: string, id: string | number) =>
      requestData<Booking>(`/bookings/${id}`, { token }),
    create: (
      token: string,
      payload: {
        tenant_id: string | number;
        vehicle_id: string | number;
        service_id: string | number;
        scheduled_at: string;
        // Required by StoreBookingRequest — "wallet" isn't a real gateway
        // yet (bookings.payment_method only allows card/eft), so the
        // booking screen maps its wallet option to "card" for now.
        payment_method: "card" | "eft";
        service_address?: string;
      }
    ) => requestData<Booking>("/bookings", { method: "POST", token, body: payload }),
    cancel: (token: string, id: string | number) =>
      requestData<Booking>(`/bookings/${id}/cancel`, { method: "POST", token }),
    // PaymentController::pay() builds its own plain {booking, voucher_earned}
    // response (no Resource auto-wrap) -> use request(), not requestData().
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
        cleanliness_rating?: number;
        staff_rating?: number;
        value_rating?: number;
        wait_time_rating?: number;
        comment?: string;
      }
    ) =>
      // Response isn't used by callers today; typed loosely on purpose.
      requestData<unknown>(`/bookings/${id}/review`, {
        method: "POST",
        token,
        body: payload,
      }),
  },

  loyalty: {
    // Hand-built plain response (no Resource auto-wrap) -> request(), not requestData().
    summary: (token: string) =>
      request<LoyaltySummary>("/loyalty/summary", { token }),
  },

  vouchers: {
    list: async (token: string) => {
      const res = await request<{ data: WalletVoucher[] }>("/vouchers", { token });
      return res.data;
    },
    redeem: (token: string, id: string | number) =>
      requestData<WalletVoucher>(`/vouchers/${id}/redeem`, {
        method: "POST",
        token,
      }),
  },

  notifications: {
    list: async (token: string) => {
      const res = await request<{ data: NotificationItem[]; unread_count: number }>(
        "/notifications",
        { token }
      );
      return res.data;
    },
    markRead: (token: string, id: string | number) =>
      requestData<NotificationItem>(`/notifications/${id}/read`, {
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
    // Hand-built plain response (no Resource auto-wrap) -> request(), not requestData().
    dashboard: (token: string) =>
      request<PartnerDashboard>("/partner/dashboard", { token }),
    bookings: (token: string) =>
      requestData<Booking[]>("/partner/bookings", { token }),
    booking: (token: string, id: string | number) =>
      requestData<Booking>(`/partner/bookings/${id}`, { token }),
    advanceBooking: (token: string, id: string | number) =>
      requestData<Booking>(`/partner/bookings/${id}/advance`, {
        method: "POST",
        token,
      }),
    services: (token: string) =>
      requestData<Service[]>("/partner/services", { token }),
    createService: (token: string, payload: Partial<Service>) =>
      requestData<Service>("/partner/services", {
        method: "POST",
        token,
        body: payload,
      }),
    updateService: (token: string, id: string | number, payload: Partial<Service>) =>
      requestData<Service>(`/partner/services/${id}`, {
        method: "PUT",
        token,
        body: payload,
      }),
    // DELETE returns 204 No Content — no body to unwrap.
    deleteService: (token: string, id: string | number) =>
      request<null>(`/partner/services/${id}`, {
        method: "DELETE",
        token,
      }),
    promotions: (token: string) => requestData<Promotion[]>("/partner/promotions", { token }),
    createPromotion: (token: string, payload: Partial<Promotion>) =>
      requestData<Promotion>("/partner/promotions", {
        method: "POST",
        token,
        body: payload,
      }),
    updatePromotion: (token: string, id: string | number, payload: Partial<Promotion>) =>
      requestData<Promotion>(`/partner/promotions/${id}`, {
        method: "PUT",
        token,
        body: payload,
      }),
    deletePromotion: (token: string, id: string | number) =>
      request<null>(`/partner/promotions/${id}`, {
        method: "DELETE",
        token,
      }),
    redeemVoucher: (
      token: string,
      payload: { code: string; booking_id?: string | number }
    ) =>
      requestData<WalletVoucher>("/partner/vouchers/redeem", {
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
