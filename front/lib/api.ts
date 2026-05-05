export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = {
  get: async <T>(path: string, options?: RequestInit): Promise<T | undefined> => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json, application/problem+json',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text ? JSON.parse(text).title || `API Error: ${response.status}` : `API Error: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  },

  post: async <T>(path: string, body?: unknown, options?: RequestInit): Promise<T | undefined> => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/problem+json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text ? JSON.parse(text).title || `API Error: ${response.status}` : `API Error: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  },

  delete: async <T>(path: string, body?: unknown, options?: RequestInit): Promise<T | undefined> => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Accept': 'application/problem+json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text ? JSON.parse(text).title || `API Error: ${response.status}` : `API Error: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  },

  patch: async <T>(path: string, body?: unknown, options?: RequestInit): Promise<T | undefined> => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Accept': 'application/problem+json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text ? JSON.parse(text).title || `API Error: ${response.status}` : `API Error: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  },

  put: async <T>(path: string, body?: unknown, options?: RequestInit): Promise<T | undefined> => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Accept': 'application/problem+json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text ? JSON.parse(text).title || `API Error: ${response.status}` : `API Error: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : (undefined as T);
  },

  getChatWebSocketUrl: (path: string): string => {
    const wsBase = API_BASE.replace(/^http/, 'ws');
    return `${wsBase}${path}`;
  },

};

export default api;
