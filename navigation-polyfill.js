(function() {
  // ChoiceAdvantage expects the Navigation API in Chrome; Firefox/Edge may not expose it, and after the 2am MST rollover the page can stop wiring navigation listeners.
  // This shim keeps the app alive by mapping `navigate` listeners to standard `popstate`.
  if (typeof window.navigation !== 'undefined') return;
  window.navigation = {
    addEventListener(type, callback) {
      if (type === 'navigate') window.addEventListener('popstate', callback);
    },
    removeEventListener(type, callback) {
      if (type === 'navigate') window.removeEventListener('popstate', callback);
    },
    currentEntry: { url: window.location.href, id: 'mock-id' },
    canGoBack: false,
    canGoForward: false
  };
})();
