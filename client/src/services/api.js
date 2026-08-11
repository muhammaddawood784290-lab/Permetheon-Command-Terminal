// =====================================================================
// API client — single entry point for backend communication.
//
// In this phase the application uses mock data. The switch is controlled
// by `USE_MOCK` (or `VITE_USE_MOCK`). When the backend is wired in Phase 2,
// this file should be the only place that needs to change behavior.
// =====================================================================

import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// Real HTTP client — configured but only used when USE_MOCK is false.
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('pct_auth_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized error normalization. Services receive plain Error objects.
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Network error';
    const normalized = new Error(message);
    normalized.status = status;
    normalized.data = error.response?.data;
    return Promise.reject(normalized);
  },
);

/**
 * Mock helpers — emulate a small network delay so loading states are
 * visible during development. UI behaves exactly as it would once the
 * real backend is wired up.
 */
export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ok(data, ms = 250) {
  return delay(ms).then(() => ({ success: true, data }));
}

export function fail(message, status = 400, ms = 250) {
  return delay(ms).then(() => {
    const e = new Error(message);
    e.status = status;
    return Promise.reject(e);
  });
}

export function paginate(list, { page = 1, limit = 20 } = {}) {
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = list.slice(start, end);
  return {
    items,
    page,
    limit,
    total: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / limit)),
  };
}

export function applyFilters(list, filters = {}) {
  return list.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') return true;
      if (Array.isArray(value)) {
        if (value.length === 0) return true;
        return value.includes(item[key]);
      }
      if (typeof value === 'function') {
        return value(item);
      }
      return item[key] === value;
    });
  });
}

export function search(list, fields, term) {
  if (!term) return list;
  const lower = String(term).toLowerCase();
  return list.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lower);
    }),
  );
}

export function sortBy(list, field, direction = 'asc') {
  const dir = direction === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (typeof av === 'string' && typeof bv === 'string') {
      return av.localeCompare(bv) * dir;
    }
    return (av > bv ? 1 : -1) * dir;
  });
}

export { httpClient };
