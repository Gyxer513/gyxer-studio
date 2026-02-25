import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface HttpRequest {
  method: HttpMethod;
  path: string;
  headers: KeyValuePair[];
  body: string;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  request: HttpRequest;
  response: HttpResponse;
}

const MAX_HISTORY = 50;

function defaultRequest(): HttpRequest {
  return {
    method: 'GET',
    path: '/',
    headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
    body: '',
  };
}

interface HttpStore {
  // Persisted
  baseUrl: string;
  bearerToken: string;
  history: HistoryEntry[];

  // Session
  activeRequest: HttpRequest;
  activeResponse: HttpResponse | null;
  isLoading: boolean;

  // Actions — base URL
  setBaseUrl: (url: string) => void;

  // Actions — bearer token
  setToken: (token: string) => void;
  clearToken: () => void;

  // Actions — request building
  setMethod: (method: HttpMethod) => void;
  setPath: (path: string) => void;
  setBody: (body: string) => void;
  setHeaders: (headers: KeyValuePair[]) => void;
  addHeader: () => void;
  removeHeader: (index: number) => void;
  toggleHeader: (index: number) => void;
  updateHeader: (index: number, field: 'key' | 'value', val: string) => void;
  loadRequest: (req: HttpRequest) => void;

  // Actions — send flow
  setLoading: (loading: boolean) => void;
  setResponse: (response: HttpResponse) => void;
  pushHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

export const useHttpStore = create<HttpStore>()(
  persist(
    (set) => ({
      // Persisted defaults
      baseUrl: 'http://localhost:3000',
      bearerToken: '',
      history: [],

      // Session defaults
      activeRequest: defaultRequest(),
      activeResponse: null,
      isLoading: false,

      // Base URL
      setBaseUrl: (baseUrl) => set({ baseUrl }),

      // Bearer token
      setToken: (bearerToken) => set({ bearerToken }),
      clearToken: () => set({ bearerToken: '' }),

      // Request building
      setMethod: (method) =>
        set((s) => ({ activeRequest: { ...s.activeRequest, method } })),

      setPath: (path) =>
        set((s) => ({ activeRequest: { ...s.activeRequest, path } })),

      setBody: (body) =>
        set((s) => ({ activeRequest: { ...s.activeRequest, body } })),

      setHeaders: (headers) =>
        set((s) => ({ activeRequest: { ...s.activeRequest, headers } })),

      addHeader: () =>
        set((s) => ({
          activeRequest: {
            ...s.activeRequest,
            headers: [...s.activeRequest.headers, { key: '', value: '', enabled: true }],
          },
        })),

      removeHeader: (index) =>
        set((s) => ({
          activeRequest: {
            ...s.activeRequest,
            headers: s.activeRequest.headers.filter((_, i) => i !== index),
          },
        })),

      toggleHeader: (index) =>
        set((s) => ({
          activeRequest: {
            ...s.activeRequest,
            headers: s.activeRequest.headers.map((h, i) =>
              i === index ? { ...h, enabled: !h.enabled } : h,
            ),
          },
        })),

      updateHeader: (index, field, val) =>
        set((s) => ({
          activeRequest: {
            ...s.activeRequest,
            headers: s.activeRequest.headers.map((h, i) =>
              i === index ? { ...h, [field]: val } : h,
            ),
          },
        })),

      loadRequest: (req) =>
        set({ activeRequest: req, activeResponse: null }),

      // Send flow
      setLoading: (isLoading) => set({ isLoading }),

      setResponse: (activeResponse) => set({ activeResponse, isLoading: false }),

      pushHistory: (entry) =>
        set((s) => ({
          history: [entry, ...s.history].slice(0, MAX_HISTORY),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'gyxer-http',
      partialize: (state) => ({
        baseUrl: state.baseUrl,
        bearerToken: state.bearerToken,
        history: state.history,
      }),
    },
  ),
);
