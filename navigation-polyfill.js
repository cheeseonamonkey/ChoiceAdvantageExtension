(function() {
  // ChoiceAdvantage expects the Navigation API in Chrome; Firefox/Edge may not expose it, and after the 2am MST rollover the page can stop wiring navigation listeners.
  // This shim keeps the app alive by mapping `navigate` listeners to standard `popstate`.
  if (typeof window.navigation !== 'undefined') return;
  const listeners = new Map();
  const entry = () => ({ url: window.location.href, id: 'mock-id', key: 'mock-id', index: 0, sameDocument: true, getState: () => null });
  const navigateEvent = source => ({
    type: 'navigate',
    canIntercept: false,
    destination: { url: window.location.href, sameDocument: true },
    downloadRequest: null,
    formData: null,
    hashChange: source && source.type === 'hashchange',
    info: null,
    navigationType: 'traverse',
    signal: { aborted: false, addEventListener() {}, removeEventListener() {} },
    userInitiated: false,
    intercept() {}
  });
  const dispatchNavigate = source => {
    const event = navigateEvent(source);
    listeners.forEach(callback => callback(event));
    if (typeof window.navigation.onnavigate === 'function') window.navigation.onnavigate(event);
  };
  const wrapHistory = method => {
    const original = history[method];
    history[method] = function() {
      const result = original.apply(this, arguments);
      dispatchNavigate({ type: method });
      return result;
    };
  };
  window.navigation = {
    addEventListener(type, callback) {
      if (type !== 'navigate' || typeof callback !== 'function') return;
      this.removeEventListener(type, callback);
      listeners.set(callback, callback);
    },
    removeEventListener(type, callback) {
      if (type !== 'navigate') return;
      listeners.delete(callback);
    },
    entries: () => [entry()],
    navigate(url) {
      if (url) window.location.assign(url);
      return { committed: Promise.resolve(entry()), finished: Promise.resolve(entry()) };
    },
    reload() {
      window.location.reload();
      return { committed: Promise.resolve(entry()), finished: Promise.resolve(entry()) };
    },
    updateCurrentEntry() {},
    traverseTo: () => ({ committed: Promise.resolve(entry()), finished: Promise.resolve(entry()) }),
    onnavigate: null,
    get currentEntry() { return entry(); },
    get canGoBack() { return false; },
    get canGoForward() { return false; }
  };
  window.addEventListener('popstate', dispatchNavigate);
  window.addEventListener('hashchange', dispatchNavigate);
  wrapHistory('pushState');
  wrapHistory('replaceState');
})();
