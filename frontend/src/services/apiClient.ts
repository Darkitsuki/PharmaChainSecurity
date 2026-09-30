import type { ApiProblemDetails } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:55198/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;

  constructor(problem: ApiProblemDetails) {
    super(problem.title || 'The request could not be completed.');
    this.name = 'ApiError';
    this.status = problem.status;
    this.detail = problem.detail;
  }
}

function resolveUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (import.meta.env.DEV) return `/api/v1${path}`;
  return `${apiBaseUrl.replace(/\/$/, '')}${path}`;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const correlationId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('X-Correlation-ID', headers.get('X-Correlation-ID') ?? correlationId);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(resolveUrl(endpoint), {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new Event('pharmasecure:unauthorized'));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      status: response.status,
      title: response.statusText,
    }));
    throw new ApiError({
      status: errorData.status ?? response.status,
      title: errorData.title ?? response.statusText,
      detail: errorData.detail,
      errors: errorData.errors,
    });
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
