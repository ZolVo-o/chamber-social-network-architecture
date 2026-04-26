import { BACKEND_CONFIGURED, buildApiUrl } from '@/config';

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

const TOKEN_KEY = 'centum-token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!BACKEND_CONFIGURED) {
    throw new Error('Backend URL is not configured. Set VITE_API_BASE_URL first.');
  }

  const token = getAuthToken();
  const shouldSendJson = options.body !== undefined && !(options.body instanceof FormData);

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...(shouldSendJson ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parse failures for non-JSON error responses.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
