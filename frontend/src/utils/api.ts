function normalizeApiBaseUrl(url: string) {
  const trimmed = url.replace(/\/$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}

const BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api'
);

export function getApiBaseUrl() {
  return BASE_URL;
}

/** Backend origin without /api suffix — for iframe previews, uploads, etc. */
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

export function getWebsitePreviewUrl(websiteId: string) {
  return `${API_ORIGIN}/api/websites/${websiteId}/preview`;
}

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async post(endpoint: string, body?: any) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(response);
  },

  async put(endpoint: string, body: any) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  async delete(endpoint: string) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async upload(endpoint: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },
};

async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    // Auto-clear stale/malformed JWT and redirect to login
    if (response.status === 401 && typeof window !== 'undefined') {
      const isPublicPage = window.location.pathname === '/create-profile';
      if (!isPublicPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
    }
    const errorMsg = data.message || 'Something went wrong';
    throw new Error(errorMsg);
  }
  return data;
}
