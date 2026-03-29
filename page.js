(function() {
  'use strict';

  const EVENT = 'ca-enhanced-page-config';
  const state = { enableAbortRequests: false, abortRequestTimeoutMs: 2500, abortRequestPatterns: [] };
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
  const matches = url => state.enableAbortRequests && state.abortRequestTimeoutMs > 0 && state.abortRequestPatterns.some(pattern => normalizeUrl(url).includes(pattern));
  const applyConfig = detail => {
    if (!detail) return;
    state.enableAbortRequests = !!detail.enableAbortRequests;
    state.abortRequestTimeoutMs = Math.max(1, Number(detail.abortRequestTimeoutMs) || 0);
    state.abortRequestPatterns = parsePatterns(detail.abortRequestPatterns);
  };
  const relayAbort = (source, url, ms) => window.dispatchEvent(new CustomEvent('ca-enhanced-auto-action', { detail: { message: `Aborted ${source} after ${ms}ms: ${url}` } }));

  window.addEventListener(EVENT, e => applyConfig(e.detail));

  if (typeof nativeFetch === 'function') {
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input && input.url;
      if (!matches(url)) return nativeFetch.apply(this, arguments);
      const controller = new AbortController();
      const signal = init && init.signal;
      const cleanupSignal = signal && signal.addEventListener ? () => signal.removeEventListener('abort', abortFromSignal) : null;
      const abortFromSignal = () => controller.abort(signal.reason);
      if (signal) {
        if (signal.aborted) controller.abort(signal.reason);
        else signal.addEventListener('abort', abortFromSignal, { once: true });
      }
      const timer = window.setTimeout(() => {
        controller.abort(new DOMException('Timed out', 'AbortError'));
        relayAbort('fetch', url, state.abortRequestTimeoutMs);
      }, state.abortRequestTimeoutMs);
      const nextInit = { ...(init || {}), signal: controller.signal };
      try {
        return nativeFetch.call(this, input, nextInit).finally(() => {
          clearTimeout(timer);
          if (cleanupSignal) cleanupSignal();
        });
      } catch (e) {
        clearTimeout(timer);
        if (cleanupSignal) cleanupSignal();
        throw e;
      }
    };
  }

  XMLHttpRequest.prototype.open = function(method, url, async = true) {
    this.__caUrl = url;
    this.__caAsync = async !== false;
    return nativeOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    if (this.__caAsync && matches(this.__caUrl)) {
      this.timeout = state.abortRequestTimeoutMs;
      this.addEventListener('timeout', () => relayAbort('xhr', this.__caUrl, state.abortRequestTimeoutMs), { once: true });
    }
    return nativeSend.apply(this, arguments);
  };

  applyConfig(window.__CA_ENHANCED_PAGE_CONFIG);
})();
