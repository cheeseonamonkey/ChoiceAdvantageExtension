(function() {
  'use strict';

  const EVENT = 'ca-enhanced-page-config';
  const state = { enableAbortRequests: false, abortRequestTimeoutMs: 3500, abortRequestPatterns: [], enableCacheControl: false, cacheControlMaxAgeSeconds: 3600, cacheControlPatterns: [] };
  const nativeFetch = window.fetch;
  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;

  const normalizePattern = value => String(value || '').trim().toLowerCase();
  const parsePatterns = value => String(value || '')
    .split('\n')
    .flatMap(line => line.split(','))
    .map(part => part.replace(/#.*/, ''))
    .map(normalizePattern)
    .filter(pattern => pattern.length >= 3);
  const normalizeUrl = value => {
    try {
      return new URL(value, location.href).href.toLowerCase();
    } catch (e) {
      return String(value || '').toLowerCase();
    }
  };
  const matchesAbort = url => state.enableAbortRequests && state.abortRequestTimeoutMs > 0 && state.abortRequestPatterns.some(pattern => normalizeUrl(url).includes(pattern));
  const matchesCacheControl = (url, method) => state.enableCacheControl && state.cacheControlMaxAgeSeconds > 0 && /^(GET|HEAD)$/i.test(method || 'GET') && state.cacheControlPatterns.some(pattern => normalizeUrl(url).includes(pattern));
  const applyConfig = detail => {
    if (!detail) return;
    state.enableAbortRequests = !!detail.enableAbortRequests;
    state.abortRequestTimeoutMs = Math.max(1, Number(detail.abortRequestTimeoutMs) || 0);
    state.abortRequestPatterns = parsePatterns(detail.abortRequestPatterns);
    state.enableCacheControl = !!detail.enableCacheControl;
    state.cacheControlMaxAgeSeconds = Math.max(1, Number(detail.cacheControlMaxAgeSeconds) || 0);
    state.cacheControlPatterns = parsePatterns(detail.cacheControlPatterns);
  };
  const relayAbort = (source, url, ms) => window.dispatchEvent(new CustomEvent('ca-enhanced-auto-action', { detail: { message: `Aborted ${source} after ${ms}ms: ${url}` } }));
  const applyCacheHeaders = headers => {
    const next = new Headers(headers || undefined);
    next.set('Cache-Control', `max-age=${state.cacheControlMaxAgeSeconds}`);
    return next;
  };

  window.addEventListener(EVENT, e => applyConfig(e.detail));

  if (typeof nativeFetch === 'function') {
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input && input.url;
      const method = (init && init.method) || (input && input.method) || 'GET';
      const shouldAbort = matchesAbort(url);
      const shouldCache = matchesCacheControl(url, method);
      if (!shouldAbort && !shouldCache) return nativeFetch.apply(this, arguments);
      const controller = shouldAbort ? new AbortController() : null;
      const signal = init && init.signal;
      const abortFromSignal = () => controller && controller.abort(signal.reason);
      const cleanupSignal = signal && signal.addEventListener && controller ? () => signal.removeEventListener('abort', abortFromSignal) : null;
      if (signal && controller) {
        if (signal.aborted) controller.abort(signal.reason);
        else signal.addEventListener('abort', abortFromSignal, { once: true });
      }
      const timer = shouldAbort ? window.setTimeout(() => {
        controller.abort(new DOMException('Timed out', 'AbortError'));
        relayAbort('fetch', url, state.abortRequestTimeoutMs);
      }, state.abortRequestTimeoutMs) : 0;
      const nextInit = { ...(init || {}), ...(shouldCache ? { cache: 'force-cache', headers: applyCacheHeaders((init && init.headers) || (input && input.headers)) } : {}), ...(controller ? { signal: controller.signal } : {}) };
      try {
        return nativeFetch.call(this, input, nextInit).finally(() => {
          if (timer) clearTimeout(timer);
          if (cleanupSignal) cleanupSignal();
        });
      } catch (e) {
        if (timer) clearTimeout(timer);
        if (cleanupSignal) cleanupSignal();
        throw e;
      }
    };
  }

  XMLHttpRequest.prototype.open = function(method, url, async = true) {
    this.__caMethod = method;
    this.__caUrl = url;
    this.__caAsync = async !== false;
    return nativeOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    if (matchesCacheControl(this.__caUrl, this.__caMethod)) {
      try {
        this.setRequestHeader('Cache-Control', `max-age=${state.cacheControlMaxAgeSeconds}`);
      } catch (e) {}
    }
    if (this.__caAsync && matchesAbort(this.__caUrl)) {
      this.timeout = state.abortRequestTimeoutMs;
      this.addEventListener('timeout', () => relayAbort('xhr', this.__caUrl, state.abortRequestTimeoutMs), { once: true });
    }
    return nativeSend.apply(this, arguments);
  };

  applyConfig(window.__CA_ENHANCED_PAGE_CONFIG);
})();
