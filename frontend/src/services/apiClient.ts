/**
 * HTTP client abstraction for communicating with PharmaSecure Web API.
 * Automatically injects X-Correlation-ID and Authorization headers.
 */
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');

  // Generate or forward Correlation ID for end-to-end tracing (Rule 09, Rule 08)
  const correlationId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': correlationId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      status: response.status,
      title: response.statusText,
    }));
    throw errorData;
  }

  return response.json() as Promise<T>;
}
