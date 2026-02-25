import React, { useCallback } from 'react';
import { useHttpStore, type HttpResponse } from '../../store/http-store';
import { useTranslation } from '../../i18n';
import { EndpointPicker } from './EndpointPicker';
import { RequestBuilder } from './RequestBuilder';
import { ResponseViewer } from './ResponseViewer';
import { RequestHistory } from './RequestHistory';

export function HttpClient() {
  const {
    baseUrl,
    bearerToken,
    activeRequest,
    isLoading,
    setLoading,
    setResponse,
    setToken,
    pushHistory,
  } = useHttpStore();
  const { t } = useTranslation();

  const handleSend = useCallback(async () => {
    if (isLoading) return;

    setLoading(true);

    const url = baseUrl.replace(/\/+$/, '') + activeRequest.path;
    const hasBody = ['POST', 'PATCH', 'PUT'].includes(activeRequest.method);

    // Build headers from enabled key-value pairs
    const headers: Record<string, string> = {};
    for (const h of activeRequest.headers) {
      if (h.enabled && h.key.trim()) {
        headers[h.key.trim()] = h.value;
      }
    }

    // Auto-inject bearer token if set and no Authorization header already exists
    if (bearerToken && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const startTime = performance.now();

    try {
      const fetchOptions: RequestInit = {
        method: activeRequest.method,
        headers,
      };

      if (hasBody && activeRequest.body.trim()) {
        fetchOptions.body = activeRequest.body;
      }

      const res = await fetch(url, fetchOptions);
      const elapsed = Math.round(performance.now() - startTime);

      // Read response headers
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      const bodyText = await res.text();

      const response: HttpResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: bodyText,
        timeMs: elapsed,
      };

      setResponse(response);

      // Auto-extract bearer token from login response
      if (
        activeRequest.path.includes('/auth/login') &&
        res.status >= 200 &&
        res.status < 300
      ) {
        try {
          const json = JSON.parse(bodyText);
          const token = json.access_token || json.accessToken || json.token;
          if (token && typeof token === 'string') {
            setToken(token);
          }
        } catch {
          // Not JSON — ignore
        }
      }

      // Push to history
      pushHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        request: { ...activeRequest },
        response,
      });
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);

      // Detect CORS or network errors
      const isCors = err instanceof TypeError && err.message.includes('Failed to fetch');
      const errorMessage = isCors
        ? t('http.corsError')
        : `${t('http.networkError')}\n\n${err.message || err}`;

      const errorResponse: HttpResponse = {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: errorMessage,
        timeMs: elapsed,
      };

      setResponse(errorResponse);
    }
  }, [baseUrl, bearerToken, activeRequest, isLoading, setLoading, setResponse, setToken, pushHistory, t]);

  return (
    <div className="flex flex-col h-full">
      {/* Endpoint picker */}
      <EndpointPicker />

      {/* Request builder */}
      <RequestBuilder onSend={handleSend} />

      {/* Response area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-2xl mb-2 animate-pulse">⏳</div>
              <div className="text-dark-300 dark:text-dark-500 text-xs">{t('http.sending')}</div>
            </div>
          </div>
        ) : (
          <ResponseViewer />
        )}
      </div>

      {/* Request history */}
      <RequestHistory />
    </div>
  );
}
