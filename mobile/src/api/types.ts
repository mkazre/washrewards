// TypeScript mirrors of the backend API resources (backend/app/Http/Resources).

export type TenantType = 'fixed_garage' | 'mobile_wash';

export interface TenantSummary {
  id: number;
  name: string;
  slug: string;
  type: TenantType;
  suburb: string | null;
  city: string | null;
  rating_avg: number;
  rating_count: number;
  from_price: number | null;
  logo_url: string | null;
  distance_km: number | null;
  latitude?: number | null;
  longitude?: number | null;
  travel_radius_km?: number | null;
  travel_fee?: number | null;
}

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number | string; // Laravel decimal cast can serialize as "59.00"
  duration_minutes: number | null;
  is_popular: boolean;
}

export interface Review {
  id: number;
  user_name?: string;
  rating: number;
  cleanliness_rating: number | null;
  staff_rating: number | null;
  value_rating: number | null;
  wait_time_rating: number | null;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface TenantDetail extends TenantSummary {
  description: string | null;
  phone: string | null;
  email: string | null;
  cover_photo_url: string | null;
  address?: string | null;
  opening_hours: unknown;
  service_areas?: string[] | null;
  services: Service[];
  reviews: Review[];
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  name: string;
  color: string | null;
  plate: string;
  is_default: boolean;
  created_at: string;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  tenants?: { id: number; name: string }[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Booking {
  id: number;
  receipt_no: string;
  tenant?: TenantSummary;
  service?: Service;
  vehicle?: Vehicle;
  status: BookingStatus;
  scheduled_at: string;
  service_address: string | null;
  price: number;
  travel_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  counts_toward_voucher: boolean;
  has_review: boolean | null;
  completed_at: string | null;
  created_at: string;
}

export interface Voucher {
  id: number;
  code: string;
  amount: number;
  status: 'active' | 'redeemed' | 'expired';
  source: string | null;
  earned_at: string | null;
  expires_at: string | null;
  redeemed_at: string | null;
}

export interface VoucherProgress {
  wash_count: number;
  threshold: number;
  remaining: number;
  voucher_amount: number;
}

export interface VouchersResponse {
  data: Voucher[];
  progress: VoucherProgress;
}

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, any>;
  read_at: string | null;
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

export interface AuthResponse {
  user: AppUser;
  token: string;
}

export interface PayResponse {
  booking: Booking;
  voucher_earned: Voucher | null;
}

// Laravel wrappers
export interface Paginated<T> {
  data: T[];
  links?: unknown;
  meta?: { current_page: number; last_page: number; total: number };
}
export interface Wrapped<T> {
  data: T;
}
