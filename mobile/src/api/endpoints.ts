import { apiFetch } from './client';
import {
  AuthResponse, AppUser, TenantSummary, TenantDetail, Vehicle, Booking,
  VouchersResponse, Voucher, AppNotification, PartnerDashboard,
  Paginated, Wrapped, PayResponse,
} from './types';

// ---- Auth ----
export const login = (email: string, password: string) =>
  apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } });

export const register = (body: { name: string; email: string; phone?: string; password: string; password_confirmation: string }) =>
  apiFetch<AuthResponse>('/auth/register', { method: 'POST', body });

export const me = (token: string) => apiFetch<AppUser>('/auth/me', { token });

export const logout = (token: string) =>
  apiFetch<{ message: string }>('/auth/logout', { method: 'POST', token });

// ---- Discovery (public) ----
export const getTenants = (query?: { type?: string; search?: string; area?: string }) =>
  apiFetch<Paginated<TenantSummary>>('/tenants', { query });

export const getTenant = (id: number) =>
  apiFetch<Wrapped<TenantDetail>>(`/tenants/${id}`).then((r) => r.data);

// ---- Vehicles ----
export const getVehicles = (token: string) =>
  apiFetch<Paginated<Vehicle>>('/vehicles', { token }).then((r) => r.data);

export const createVehicle = (
  token: string,
  body: { make: string; model: string; color?: string; plate: string; is_default?: boolean },
) => apiFetch<Wrapped<Vehicle>>('/vehicles', { method: 'POST', token, body }).then((r) => r.data);

// ---- Bookings ----
export const getBookings = (token: string) =>
  apiFetch<Paginated<Booking>>('/bookings', { token }).then((r) => r.data);

export const createBooking = (
  token: string,
  body: {
    tenant_id: number; service_id: number; vehicle_id: number; scheduled_at: string;
    payment_method: 'card' | 'eft'; service_address?: string;
  },
) => apiFetch<Wrapped<Booking>>('/bookings', { method: 'POST', token, body }).then((r) => r.data);

export const payBooking = (token: string, bookingId: number) =>
  apiFetch<PayResponse>(`/bookings/${bookingId}/pay`, { method: 'POST', token, body: {} });

export const reviewBooking = (
  token: string,
  bookingId: number,
  body: { rating: number; cleanliness_rating?: number; staff_rating?: number; value_rating?: number; wait_time_rating?: number; comment?: string },
) => apiFetch<Wrapped<any>>(`/bookings/${bookingId}/review`, { method: 'POST', token, body });

// ---- Vouchers ----
export const getVouchers = (token: string) => apiFetch<VouchersResponse>('/vouchers', { token });

export const redeemVoucher = (token: string, voucherId: number) =>
  apiFetch<Wrapped<Voucher>>(`/vouchers/${voucherId}/redeem`, { method: 'POST', token, body: {} });

// ---- Notifications ----
export const getNotifications = (token: string) =>
  apiFetch<Paginated<AppNotification>>('/notifications', { token }).then((r) => r.data);

export const markAllNotificationsRead = (token: string) =>
  apiFetch<unknown>('/notifications/read-all', { method: 'POST', token, body: {} });

// ---- Partner ----
export const getPartnerDashboard = (token: string) =>
  apiFetch<PartnerDashboard>('/partner/dashboard', { token });

export const getPartnerBookings = (token: string) =>
  apiFetch<Paginated<Booking>>('/partner/bookings', { token }).then((r) => r.data);

export const advancePartnerBooking = (token: string, bookingId: number) =>
  apiFetch<Wrapped<Booking>>(`/partner/bookings/${bookingId}/advance`, { method: 'POST', token, body: {} });
