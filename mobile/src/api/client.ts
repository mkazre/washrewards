import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | undefined>;
};

export async function apiFetch<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', body, token, query } = opts;

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error — check your connection and try again.', 0);
  }

  if (res.status === 204) return undefined as T;

  let json: any = null;
  const text = await res.text();
  if (text) {
    try { json = JSON.parse(text); } catch { /* non-JSON response */ }
  }

  if (!res.ok) {
    const message = json?.message || `Request failed (${res.status}).`;
    throw new ApiError(message, res.status, json?.errors);
  }

  return json as T;
}
