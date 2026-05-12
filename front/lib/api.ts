export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function formatApiError(parsed: Record<string, unknown>, fallback: string): string {
  if (Array.isArray(parsed.errors) && parsed.errors.length) {
    const first = parsed.errors[0] as { message?: string; location?: string } | undefined;
    if (first) {
      const field = first.location?.replace(/^body\./, '') || 'field';
      let msg = first.message || 'invalid value';
      msg = msg
        .replace(/^expected string to be RFC 5322 email: .*/, 'invalid email format')
        .replace(/^expected number >= (\d+)/, 'must be >= $1');
      return `${field}: ${msg}`;
    }
  }
  return (parsed.detail as string) || (parsed.title as string) || fallback;
}

function getAuthHeader(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const match = document.cookie.match(/auth_token=([^;]+)/);
  if (match) {
    return { 'Authorization': `Basic ${match[1]}` };
  }
  return {};
}

async function fetchWithErrorHandling<T>(url: string, options: RequestInit): Promise<T | undefined> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const text = await response.text();
      let message = `API Error: ${response.status}`;
      if (text) {
        try {
          const parsed = JSON.parse(text);
          message = formatApiError(parsed, message);
        } catch {}
      }
      throw new Error(message);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  } catch (error) {
    if (error instanceof TypeError) {
      console.warn(`[API] Network error on ${options.method ?? 'GET'} ${url}:`, error.message);
      return undefined;
    }
    throw error;
  }
}

export const api = {
  get: async <T>(path: string, options?: RequestInit): Promise<T | undefined> => {
    return fetchWithErrorHandling<T>(`${API_BASE}${path}`, {
      ...options,
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json, application/problem+json',
        ...getAuthHeader(),
        ...(options?.headers ?? {}),
      },
    });
  },

  post: async <T>(path: string, body?: unknown, options?: RequestInit): Promise<T | undefined> => {
    return fetchWithErrorHandling<T>(`${API_BASE}${path}`, {
      ...options,
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/problem+json',
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...getAuthHeader(),
        ...(options?.headers ?? {}),
      },
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  delete: async <T>(path: string, body?: unknown, options?: RequestInit): Promise<T | undefined> => {
    return fetchWithErrorHandling<T>(`${API_BASE}${path}`, {
      ...options,
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/problem+json',
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),

        ...getAuthHeader(),
        ...(options?.headers ?? {}),
      },
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  patch: async <T>(path: string, body?: unknown, options?: RequestInit): Promise<T | undefined> => {
    return fetchWithErrorHandling<T>(`${API_BASE}${path}`, {
      ...options,
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Accept': 'application/problem+json',
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...getAuthHeader(),
        ...(options?.headers ?? {}),
      },
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  put: async <T>(path: string, body?: unknown, options?: RequestInit): Promise<T | undefined> => {
    return fetchWithErrorHandling<T>(`${API_BASE}${path}`, {
      ...options,
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Accept': 'application/problem+json',
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...getAuthHeader(),
        ...(options?.headers ?? {}),
      },
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  },

  getChatWebSocketUrl: (path: string): string => {
    const wsBase = API_BASE.replace(/^http/, 'ws');
    return `${wsBase}${path}`;
  },

};

export default api;
