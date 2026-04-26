export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '';

export const BACKEND_CONFIGURED = API_BASE_URL.length > 0;

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
