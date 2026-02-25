import { describe, it, expect, beforeEach } from 'vitest';
import { useHttpStore } from './http-store';

// Reset store before each test
beforeEach(() => {
  useHttpStore.setState({
    baseUrl: 'http://localhost:3000',
    bearerToken: '',
    history: [],
    activeRequest: {
      method: 'GET',
      path: '/',
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      body: '',
    },
    activeResponse: null,
    isLoading: false,
  });
});

describe('http-store', () => {
  // ─── Bearer Token ──────────────────────────────────────

  describe('bearer token', () => {
    it('should start with empty token', () => {
      expect(useHttpStore.getState().bearerToken).toBe('');
    });

    it('should set token', () => {
      useHttpStore.getState().setToken('my-jwt-token');
      expect(useHttpStore.getState().bearerToken).toBe('my-jwt-token');
    });

    it('should clear token', () => {
      useHttpStore.getState().setToken('my-jwt-token');
      useHttpStore.getState().clearToken();
      expect(useHttpStore.getState().bearerToken).toBe('');
    });

    it('should overwrite existing token', () => {
      useHttpStore.getState().setToken('old-token');
      useHttpStore.getState().setToken('new-token');
      expect(useHttpStore.getState().bearerToken).toBe('new-token');
    });
  });

  // ─── Base URL ──────────────────────────────────────────

  describe('base URL', () => {
    it('should have default base URL', () => {
      expect(useHttpStore.getState().baseUrl).toBe('http://localhost:3000');
    });

    it('should set base URL', () => {
      useHttpStore.getState().setBaseUrl('http://localhost:4000');
      expect(useHttpStore.getState().baseUrl).toBe('http://localhost:4000');
    });
  });

  // ─── Request Building ──────────────────────────────────

  describe('request building', () => {
    it('should set method', () => {
      useHttpStore.getState().setMethod('POST');
      expect(useHttpStore.getState().activeRequest.method).toBe('POST');
    });

    it('should set path', () => {
      useHttpStore.getState().setPath('/users');
      expect(useHttpStore.getState().activeRequest.path).toBe('/users');
    });

    it('should set body', () => {
      useHttpStore.getState().setBody('{"name":"test"}');
      expect(useHttpStore.getState().activeRequest.body).toBe('{"name":"test"}');
    });

    it('should add header', () => {
      useHttpStore.getState().addHeader();
      const headers = useHttpStore.getState().activeRequest.headers;
      expect(headers).toHaveLength(2); // Content-Type + new empty
      expect(headers[1]).toEqual({ key: '', value: '', enabled: true });
    });

    it('should remove header', () => {
      useHttpStore.getState().addHeader();
      useHttpStore.getState().removeHeader(1);
      expect(useHttpStore.getState().activeRequest.headers).toHaveLength(1);
    });

    it('should toggle header', () => {
      useHttpStore.getState().toggleHeader(0);
      expect(useHttpStore.getState().activeRequest.headers[0].enabled).toBe(false);
    });

    it('should update header key/value', () => {
      useHttpStore.getState().addHeader();
      useHttpStore.getState().updateHeader(1, 'key', 'Authorization');
      useHttpStore.getState().updateHeader(1, 'value', 'Bearer xyz');
      const h = useHttpStore.getState().activeRequest.headers[1];
      expect(h.key).toBe('Authorization');
      expect(h.value).toBe('Bearer xyz');
    });

    it('should load request and clear response', () => {
      useHttpStore.setState({ activeResponse: { status: 200, statusText: 'OK', headers: {}, body: '{}', timeMs: 10 } });
      useHttpStore.getState().loadRequest({
        method: 'DELETE',
        path: '/users/1',
        headers: [],
        body: '',
      });
      expect(useHttpStore.getState().activeRequest.method).toBe('DELETE');
      expect(useHttpStore.getState().activeRequest.path).toBe('/users/1');
      expect(useHttpStore.getState().activeResponse).toBeNull();
    });
  });

  // ─── History ───────────────────────────────────────────

  describe('history', () => {
    it('should push history entry', () => {
      useHttpStore.getState().pushHistory({
        id: '1',
        timestamp: Date.now(),
        request: { method: 'GET', path: '/test', headers: [], body: '' },
        response: { status: 200, statusText: 'OK', headers: {}, body: '{}', timeMs: 5 },
      });
      expect(useHttpStore.getState().history).toHaveLength(1);
    });

    it('should prepend new entries (newest first)', () => {
      useHttpStore.getState().pushHistory({
        id: '1', timestamp: 1000,
        request: { method: 'GET', path: '/first', headers: [], body: '' },
        response: { status: 200, statusText: 'OK', headers: {}, body: '', timeMs: 1 },
      });
      useHttpStore.getState().pushHistory({
        id: '2', timestamp: 2000,
        request: { method: 'POST', path: '/second', headers: [], body: '' },
        response: { status: 201, statusText: 'Created', headers: {}, body: '', timeMs: 2 },
      });
      expect(useHttpStore.getState().history[0].id).toBe('2');
      expect(useHttpStore.getState().history[1].id).toBe('1');
    });

    it('should limit history to 50 entries', () => {
      for (let i = 0; i < 55; i++) {
        useHttpStore.getState().pushHistory({
          id: String(i), timestamp: i,
          request: { method: 'GET', path: `/${i}`, headers: [], body: '' },
          response: { status: 200, statusText: 'OK', headers: {}, body: '', timeMs: 1 },
        });
      }
      expect(useHttpStore.getState().history).toHaveLength(50);
    });

    it('should clear history', () => {
      useHttpStore.getState().pushHistory({
        id: '1', timestamp: 1,
        request: { method: 'GET', path: '/', headers: [], body: '' },
        response: { status: 200, statusText: 'OK', headers: {}, body: '', timeMs: 1 },
      });
      useHttpStore.getState().clearHistory();
      expect(useHttpStore.getState().history).toHaveLength(0);
    });
  });

  // ─── Send Flow ─────────────────────────────────────────

  describe('send flow', () => {
    it('should set loading state', () => {
      useHttpStore.getState().setLoading(true);
      expect(useHttpStore.getState().isLoading).toBe(true);
    });

    it('should set response and clear loading', () => {
      useHttpStore.getState().setLoading(true);
      useHttpStore.getState().setResponse({
        status: 200,
        statusText: 'OK',
        headers: {},
        body: '{"id":1}',
        timeMs: 42,
      });
      expect(useHttpStore.getState().isLoading).toBe(false);
      expect(useHttpStore.getState().activeResponse?.status).toBe(200);
      expect(useHttpStore.getState().activeResponse?.body).toBe('{"id":1}');
    });
  });
});
