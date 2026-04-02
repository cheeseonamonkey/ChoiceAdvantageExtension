// ChoiceAdvantage Enhanced v4.1 - Minimal
(function() {
  'use strict';

  const LOG = '[CA Enhanced]';
  const DEFAULTS = {
    dnrList: '',
    enableAbortRequests: false,
    abortRequestTimeoutMs: 3500,
    abortRequestPatterns: '',
    fixMixedContentFavicon: true,
    suppressWelcomeImage404: true,
    dedupeErrorMessageWriter: true,
    guardHideGooglePopup: true,
    removeUnusedFontPreload: true,
    removeTelemetryHints: true,
    lazyLoadNoncriticalImages: false,
    hideNoncriticalImages: false,
    animationMode: 'reduced',
    enableNavPrefetch: true,
    navPrefetchLabels: 'arrivals\ndepartures\nin-house',
    enableDNR: true,
    enableCacheControl: false,
    cacheControlMaxAgeSeconds: 3600,
    cacheControlPatterns: '',
    enableEscapeKey: true,
    enableHideColumn: true,
    enableHideRow: true,
    enableRememberUsername: true,
    rememberedUsername: '',
    rememberedUsernames: '',
    dnrTooltipText: 'Check DNR!',
    dnrHighlightColor: '#dc3545',
    backLinkText: 'Back',
    hideColumnMenuText: 'Hide Column',
    hideRowMenuText: 'Hide Row'
  };
  const HIGHLIGHT = {
    textDecoration: 'underline',
    textDecorationThickness: '2px',
    textUnderlineOffset: '2px',
    cursor: 'help'
  };
  const TOOLTIP_STYLE = {
    position: 'fixed',
    zIndex: '2147483647',
    pointerEvents: 'none',
    opacity: '0',
    transform: 'translateY(4px)',
    transition: 'opacity 0.12s ease, transform 0.12s ease',
    background: '#fff4d6',
    color: '#7a2e12',
    border: '1px solid #f0c36d',
    borderRadius: '8px',
    padding: '6px 10px',
    boxShadow: '0 8px 22px rgba(0, 0, 0, 0.18)',
    font: '600 12px/1.2 "Segoe UI", Arial, sans-serif',
    whiteSpace: 'nowrap'
  };
  const AUTO_ACTION_STYLE = {
    position: 'fixed',
    right: '14px',
    bottom: '14px',
    zIndex: '2147483647',
    maxWidth: '320px',
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#edf7ef',
    color: '#215732',
    border: '1px solid #c7e2cd',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.14)',
    font: '600 12px/1.35 "Segoe UI", Arial, sans-serif',
    opacity: '0',
    transform: 'translateY(6px)',
    transition: 'opacity 0.14s ease, transform 0.14s ease',
    pointerEvents: 'none'
  };
  const ALIASES = {
    ALEXANDER: 'ALEX', ALEXANDRA: 'ALEX',
    BENJAMIN: 'BEN',
    CHRISTOPHER: 'CHRIS', CHRISTINE: 'CHRIS',
    DANIEL: 'DAN',
    MICHAEL: 'MIKE',
    ROBERT: 'ROB',
    WILLIAM: 'BILL',
    RICHARD: 'RICK',
    THOMAS: 'TOM',
    JAMES: 'JIM'
  };
  const USERNAME_HINTS = ['user', 'username', 'login', 'email', 'userid', 'account', 'member'];
  const MAX_REMEMBERED_USERNAMES = 20;
  const EMPTY_ICON = 'data:image/x-icon;base64,AAABAAEAEBAAAAAAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const BROKEN_FAVICON = 'http://www.choiceadvantage.com/choicehotels/sign_in.jsp';
  const BROKEN_WELCOME_IMAGE = '/choicehotels/welcome/images/welcome-thank-you.jpg';
  const ERROR_WRITER = 'errormessagewriter.js';
  const STALE_PRELOAD = 'sansation-light-webfont.woff';
  const TELEMETRY_HINT_HOSTS = ['content.nps.skytouchnps.com', 's.go-mpulse.net', 's2.go-mpulse.net', 'p11.techlab-cdn.com'];
  const HEAD_HINTS = [
    { rel: 'dns-prefetch', href: '//skytouchcommunity.force.com' },
    { rel: 'preconnect', href: 'https://skytouchcommunity.force.com', crossorigin: 'anonymous' },
    { rel: 'dns-prefetch', href: '//skytouchu.litmos.com' },
    { rel: 'preconnect', href: 'https://skytouchu.litmos.com', crossorigin: 'anonymous' },
    { rel: 'dns-prefetch', href: '//sggl.la1-c2-ph2.salesforceliveagent.com' },
    { rel: 'preconnect', href: 'https://sggl.la1-c2-ph2.salesforceliveagent.com', crossorigin: 'anonymous' }
  ];
  const NONCRITICAL_IMAGE_PATTERNS = ['/choicehotels/welcome/', '/choicehotels/sign_in', '/choicehotels/login'];
  const PAGE_CONFIG_EVENT = 'ca-enhanced-page-config';
  const PAGE_ACTION_EVENT = 'ca-enhanced-auto-action';
  const seenScripts = new Set();
  const state = { settings: { ...DEFAULTS }, dnrRules: [], lastClickedHeader: null, lastClickedRow: null, tooltip: null, activeLink: null, autoActionToast: null, autoActionTimer: 0, rescanTimer: 0, headObserver: null, headObserverStopTimer: 0, headObserverLoadBound: false, headHintsLoadBound: false, googlePopupGuardTimer: 0, pageScriptInjected: false, animationStyle: null, prefetchedHrefs: new Set(), navPrefetchLabels: [], usernameOptions: null, isUserLoginPage: null, loginPageCheckTime: 0, loginPageTitle: '' };

  const safe = (label, fn) => {
    try {
      return fn();
    } catch (e) {
      console.error(`${LOG} ${label}:`, e);
    }
  };

  const normalizeName = name => {
    if (!name) return '';
    try {
      return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z,\s'-]+/g, ' ')
        .replace(/\s*,\s*/g, ',')
        .trim()
        .split(/\s+/)
        .map(word => ALIASES[word] || word)
        .join(' ');
    } catch (e) {
      return String(name).toUpperCase().trim();
    }
  };

  const parseName = name => {
    const normalized = normalizeName(name);
    const parts = normalized.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length < 2) return null;
    const first = normalized.includes(',') ? parts[1] : parts[0];
    const last = normalized.includes(',') ? parts[0] : parts[parts.length - 1];
    return { first, last, label: `${last}, ${first}` };
  };

  const compileRules = list => list.split('\n').map(parseName).filter(Boolean);

  function findDNRMatch(text) {
    if (!state.settings.enableDNR || !state.dnrRules.length || !text) return null;
    const parts = normalizeName(text).replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length < 2) return null;
    const words = new Set(parts);
    return state.dnrRules.find(rule => words.has(rule.first) && words.has(rule.last)) || null;
  }

  const cleanText = value => (value || '').trim();
  const settingText = (key, fallback) => cleanText(state.settings[key]) || fallback;
  const parseSimpleList = value => String(value || '').split('\n').flatMap(line => line.split(',')).map(part => cleanText(part).toLowerCase()).filter(part => part.length >= 3);
  const escapeRegExp = value => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parseRememberedUsernames = value => {
    const seen = new Set();
    return String(value || '').split('\n').map(cleanText).filter(Boolean).filter(username => {
      const key = username.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, MAX_REMEMBERED_USERNAMES);
  };
  const getRememberedUsernames = settings => parseRememberedUsernames(settings.rememberedUsernames || settings.rememberedUsername || '');
  const serializeRememberedUsernames = usernames => usernames.join('\n');
  const matchesNavPrefetchLabel = (text, labels) => !!text && labels.some(label => new RegExp(`(^|\\s)${escapeRegExp(label).replace(/\s+/g, '\\s+')}(?=\\s|$)`, 'i').test(text));
  const normalizeSrc = value => {
    try {
      return new URL(value, location.href).href;
    } catch (e) {
      return String(value || '').trim();
    }
  };
  const isBrokenWelcomeImage = value => normalizeSrc(value).includes(BROKEN_WELCOME_IMAGE);
  const isBrokenFavicon = value => normalizeSrc(value) === BROKEN_FAVICON;
  const isErrorWriter = value => normalizeSrc(value).toLowerCase().includes(ERROR_WRITER);
  const isStalePreload = value => normalizeSrc(value).toLowerCase().includes(STALE_PRELOAD);
  const isTelemetryHint = value => TELEMETRY_HINT_HOSTS.some(host => normalizeSrc(value).includes(`://${host}`));
  const isNoncriticalImage = value => NONCRITICAL_IMAGE_PATTERNS.some(pattern => normalizeSrc(value).includes(pattern));
  const headFixesEnabled = () => state.settings.fixMixedContentFavicon || state.settings.suppressWelcomeImage404 || state.settings.dedupeErrorMessageWriter || state.settings.removeUnusedFontPreload || state.settings.removeTelemetryHints || state.settings.lazyLoadNoncriticalImages || state.settings.hideNoncriticalImages;

  function hintLazyLoad(node) {
    node.loading = 'lazy';
    node.decoding = 'async';
    if ('fetchPriority' in node) node.fetchPriority = 'low';
  }

  function injectPageScript() {
    if (state.pageScriptInjected || !document.documentElement) return;
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('page.js');
    script.dataset.caEnhanced = 'page';
    script.async = false;
    script.addEventListener('load', () => script.remove(), { once: true });
    script.addEventListener('error', () => script.remove(), { once: true });
    (document.head || document.documentElement).appendChild(script);
    state.pageScriptInjected = true;
  }

  function syncPageConfig() {
    window.__CA_ENHANCED_PAGE_CONFIG = {
      enableAbortRequests: !!state.settings.enableAbortRequests,
      abortRequestTimeoutMs: Math.max(1, Number(state.settings.abortRequestTimeoutMs) || DEFAULTS.abortRequestTimeoutMs),
      abortRequestPatterns: state.settings.abortRequestPatterns || '',
      enableCacheControl: !!state.settings.enableCacheControl,
      cacheControlMaxAgeSeconds: Math.max(1, Number(state.settings.cacheControlMaxAgeSeconds) || DEFAULTS.cacheControlMaxAgeSeconds),
      cacheControlPatterns: state.settings.cacheControlPatterns || ''
    };
    window.dispatchEvent(new CustomEvent(PAGE_CONFIG_EVENT, { detail: window.__CA_ENHANCED_PAGE_CONFIG }));
  }

  function sanitizeNode(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches('head') || node === document.documentElement) ensureHeadHints();
    if (state.settings.fixMixedContentFavicon && node.matches('link[rel*="icon"][href]') && isBrokenFavicon(node.href)) node.href = EMPTY_ICON;
    if (state.settings.removeUnusedFontPreload && node.matches('link[rel="preload"][href]') && isStalePreload(node.href)) node.remove();
    if (state.settings.removeTelemetryHints && node.matches('link[href][rel]') && /\b(preconnect|dns-prefetch|prefetch|preload|modulepreload)\b/i.test(node.rel) && isTelemetryHint(node.href)) node.remove();
    if (state.settings.suppressWelcomeImage404 && node.matches('img[src]') && isBrokenWelcomeImage(node.src)) {
      node.removeAttribute('src');
      node.style.display = 'none';
    }
    if (state.settings.lazyLoadNoncriticalImages && node.matches('img[src]') && isNoncriticalImage(node.src)) hintLazyLoad(node);
    if (state.settings.hideNoncriticalImages && node.matches('img[src]') && isNoncriticalImage(node.src)) {
      hintLazyLoad(node);
      node.style.visibility = 'hidden';
      node.style.maxHeight = '1px';
      node.style.maxWidth = '1px';
      node.style.opacity = '0';
    }
    if (node.matches('script[src]')) sanitizeScript(node);
    node.querySelectorAll?.('link[rel*="icon"][href], link[rel="preload"][href], img[src], script[src]').forEach(child => sanitizeNode(child));
  }

  function ensureHeadHints() {
    const head = document.head;
    if (!head) {
      if (!state.headHintsLoadBound) {
        state.headHintsLoadBound = true;
        window.addEventListener('DOMContentLoaded', ensureHeadHints, { once: true });
      }
      return;
    }
    const fragment = document.createDocumentFragment();
    HEAD_HINTS.forEach(hint => {
      const selector = `link[data-ca-enhanced="head-hint"][rel="${hint.rel}"][href="${hint.href}"]`;
      if (head.querySelector(selector)) return;
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      link.dataset.caEnhanced = 'head-hint';
      if (hint.crossorigin) link.crossOrigin = hint.crossorigin;
      fragment.appendChild(link);
    });
    if (fragment.childNodes.length) head.insertBefore(fragment, head.firstChild);
  }

  function syncAnimationMode() {
    if (!document.documentElement) return;
    if (!state.animationStyle) {
      state.animationStyle = document.createElement('style');
      state.animationStyle.dataset.caEnhanced = 'animation-mode';
      document.documentElement.appendChild(state.animationStyle);
    }
    const mode = state.settings.animationMode;
    if (mode === 'off') {
      state.animationStyle.textContent = '*,:before,:after{animation:none !important;transition:none !important;scroll-behavior:auto !important;}';
      return;
    }
    if (mode === 'reduced') {
      state.animationStyle.textContent = '*,:before,:after{animation-duration:0.25s !important;animation-delay:0s !important;transition-duration:0.25s !important;transition-delay:0s !important;scroll-behavior:auto !important;}';
      return;
    }
    state.animationStyle.textContent = '';
  }

  function sanitizeScript(node) {
    const src = normalizeSrc(node.src);
    if (!src) return;
    if (state.settings.dedupeErrorMessageWriter && isErrorWriter(src)) {
      if (seenScripts.has(src)) {
        node.type = 'javascript/blocked';
        node.removeAttribute('src');
        node.remove();
        return;
      }
      seenScripts.add(src);
    }
  }

  function guardHideGooglePopUp() {
    if (!state.settings.guardHideGooglePopup || typeof window.hideGooglePopUp !== 'function' || window.hideGooglePopUp.__caGuarded) return;
    const original = window.hideGooglePopUp;
    const wrapped = function(...args) {
      try {
        return original.apply(this, args);
      } catch (e) {
        if (!(e instanceof TypeError) || !String(e.message || '').includes('style')) throw e;
      }
    };
    wrapped.__caGuarded = true;
    window.hideGooglePopUp = wrapped;
  }

  function scheduleGooglePopupGuard() {
    if (!state.settings.guardHideGooglePopup || state.googlePopupGuardTimer) return;
    state.googlePopupGuardTimer = window.setInterval(() => {
      guardHideGooglePopUp();
      if (window.hideGooglePopUp && window.hideGooglePopUp.__caGuarded) {
        clearInterval(state.googlePopupGuardTimer);
        state.googlePopupGuardTimer = 0;
      }
    }, 150);
  }

  function stopGooglePopupGuard() {
    if (!state.googlePopupGuardTimer) return;
    clearInterval(state.googlePopupGuardTimer);
    state.googlePopupGuardTimer = 0;
  }

  function scheduleHeadObserverStop() {
    if (!state.headObserver) return;
    clearTimeout(state.headObserverStopTimer);
    const stop = () => {
      if (!state.headObserver) return;
      state.headObserver.disconnect();
      state.headObserver = null;
    };
    if (document.readyState === 'complete') state.headObserverStopTimer = window.setTimeout(stop, 3000);
    else if (!state.headObserverLoadBound) {
      state.headObserverLoadBound = true;
      window.addEventListener('load', () => {
        clearTimeout(state.headObserverStopTimer);
        state.headObserverStopTimer = window.setTimeout(stop, 3000);
      }, { once: true });
    }
  }

  function initHeadFixes() {
    if (state.headObserver) state.headObserver.disconnect();
    clearTimeout(state.headObserverStopTimer);
    if (headFixesEnabled()) {
      sanitizeNode(document.documentElement);
      state.headObserver = new MutationObserver(mutations => mutations.forEach(({ addedNodes, target }) => {
        addedNodes.forEach(node => sanitizeNode(node));
        if (target) sanitizeNode(target);
      }));
      state.headObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href', 'rel'] });
      scheduleHeadObserverStop();
    } else state.headObserver = null;
    if (state.settings.guardHideGooglePopup) scheduleGooglePopupGuard();
    else stopGooglePopupGuard();
  }

  function ensureTooltip() {
    if (state.tooltip || !document.body) return state.tooltip;
    state.tooltip = document.createElement('div');
    state.tooltip.textContent = settingText('dnrTooltipText', DEFAULTS.dnrTooltipText);
    Object.assign(state.tooltip.style, TOOLTIP_STYLE);
    document.body.appendChild(state.tooltip);
    return state.tooltip;
  }

  function ensureAutoActionToast() {
    if (state.autoActionToast || !document.body) return state.autoActionToast;
    state.autoActionToast = document.createElement('div');
    Object.assign(state.autoActionToast.style, AUTO_ACTION_STYLE);
    document.body.appendChild(state.autoActionToast);
    return state.autoActionToast;
  }

  function showAutoAction(message) {
    const toast = ensureAutoActionToast();
    if (!toast || !message) return;
    clearTimeout(state.autoActionTimer);
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    state.autoActionTimer = window.setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
    }, 1600);
  }

  function positionTooltip(link) {
    const tooltip = ensureTooltip();
    if (!tooltip || !link) return;
    const rect = link.getBoundingClientRect();
    const top = rect.top > tooltip.offsetHeight + 16 ? rect.top - tooltip.offsetHeight - 10 : rect.bottom + 10;
    const left = Math.min(window.innerWidth - tooltip.offsetWidth - 8, Math.max(8, rect.left + (rect.width - tooltip.offsetWidth) / 2));
    tooltip.style.top = `${Math.max(8, top)}px`;
    tooltip.style.left = `${left}px`;
  }

  function showTooltip(link) {
    const tooltip = ensureTooltip();
    if (!tooltip || !link || !state.settings.enableDNR || !link.dataset.caDnr) return;
    state.activeLink = link;
    tooltip.textContent = settingText('dnrTooltipText', DEFAULTS.dnrTooltipText);
    positionTooltip(link);
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateY(0)';
  }

  function hideTooltip(link) {
    if (link && state.activeLink && link !== state.activeLink) return;
    state.activeLink = null;
    if (!state.tooltip) return;
    state.tooltip.style.opacity = '0';
    state.tooltip.style.transform = 'translateY(4px)';
  }

  function clearDNRLink(link) {
    Object.keys(HIGHLIGHT).forEach(key => { link.style[key] = ''; });
    link.style.textDecorationColor = '';
    delete link.dataset.caDnr;
  }

  function refreshDNRLinks(root = document) {
    root.querySelectorAll('table a').forEach(link => safe('DNR link scan failed', () => {
      const match = findDNRMatch(link.innerText || link.textContent);
      if (!match) {
        if (link.dataset.caDnr) clearDNRLink(link);
        return;
      }
      Object.assign(link.style, HIGHLIGHT);
      link.style.textDecorationColor = settingText('dnrHighlightColor', DEFAULTS.dnrHighlightColor);
      link.dataset.caDnr = match.label;
      link.removeAttribute('title');
    }));
    if (!state.settings.enableDNR) hideTooltip();
  }

  function scheduleDNRRefresh() {
    if (!state.settings.enableDNR || state.rescanTimer) return;
    state.rescanTimer = window.setTimeout(() => {
      state.rescanTimer = 0;
      safe('DNR highlighting failed', refreshDNRLinks);
    }, 60);
  }

  function applySettings(nextSettings) {
    state.settings = { ...state.settings, ...nextSettings };
    state.dnrRules = compileRules(state.settings.dnrList || '');
    state.navPrefetchLabels = parseSimpleList(state.settings.navPrefetchLabels || '');
    syncPageConfig();
    syncAnimationMode();
    initHeadFixes();
    if (state.tooltip) state.tooltip.textContent = settingText('dnrTooltipText', DEFAULTS.dnrTooltipText);
    safe('DNR highlighting failed', refreshDNRLinks);
    safe('Username autofill failed', autofillRememberedUsername);
  }

  function initDNRUI() {
    const findLink = target => target && target.closest && target.closest('a[data-ca-dnr]');
    document.addEventListener('mouseover', e => {
      const link = findLink(e.target);
      if (link) showTooltip(link);
    });
    document.addEventListener('mouseout', e => {
      const link = findLink(e.target);
      if (link) hideTooltip(link);
    });
    document.addEventListener('focusin', e => {
      const link = findLink(e.target);
      if (link) showTooltip(link);
    });
    document.addEventListener('focusout', e => {
      const link = findLink(e.target);
      if (link) hideTooltip(link);
    });
    window.addEventListener('scroll', () => state.activeLink && positionTooltip(state.activeLink), true);
    window.addEventListener('resize', () => state.activeLink && positionTooltip(state.activeLink));
    new MutationObserver(scheduleDNRRefresh).observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  function initEscapeKey() {
    document.addEventListener('keydown', e => safe('Escape key failed', () => {
      if (!state.settings.enableEscapeKey || e.key !== 'Escape' || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
      const tagName = e.target && e.target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;
      const targetText = settingText('backLinkText', DEFAULTS.backLinkText).toLowerCase();
      const backLink = Array.from(document.querySelectorAll('a')).find(link => link.textContent && link.textContent.trim().toLowerCase() === targetText);
      if (!backLink) return;
      e.preventDefault();
      showAutoAction(`Auto-clicked "${backLink.textContent.trim() || targetText}"`);
      backLink.click();
    }));
  }

  function initTableTracking() {
    document.addEventListener('mousedown', e => safe('Table tracking failed', () => {
      state.lastClickedHeader = state.settings.enableHideColumn && e.target ? e.target.closest('table th') : null;
      state.lastClickedRow = state.settings.enableHideRow && e.target ? e.target.closest('table tr') : null;
    }));
  }

  function hideSelectedColumn() {
    if (!state.settings.enableHideColumn) return;
    if (!state.lastClickedHeader) return console.warn(`${LOG} No header selected`);
    const table = state.lastClickedHeader.closest('table');
    const row = state.lastClickedHeader.parentElement;
    if (!table || !row) {
      state.lastClickedHeader = null;
      return console.warn(`${LOG} No table found`);
    }
    const colIndex = Array.from(row.children).indexOf(state.lastClickedHeader);
    if (colIndex < 0) {
      state.lastClickedHeader = null;
      return console.warn(`${LOG} Column index not found`);
    }
    table.querySelectorAll('tr').forEach(rowEl => {
      if (rowEl.children[colIndex]) rowEl.children[colIndex].style.display = 'none';
    });
    showAutoAction(`Auto-hid column "${state.lastClickedHeader.textContent.trim() || colIndex + 1}"`);
    state.lastClickedHeader = null;
  }

  function hideSelectedRow() {
    if (!state.settings.enableHideRow) return;
    if (!state.lastClickedRow) return console.warn(`${LOG} No row selected`);
    const rowLabel = Array.from(state.lastClickedRow.querySelectorAll('th, td')).map(cell => cleanText(cell.textContent)).find(Boolean);
    state.lastClickedRow.style.display = 'none';
    showAutoAction(`Auto-hid row${rowLabel ? ` "${rowLabel}"` : ''}`);
    state.lastClickedRow = null;
  }

  function isUsernameField(input) {
    if (!input || input.type === 'password' || input.disabled || input.readOnly) return false;
    const text = [input.type, input.name, input.id, input.placeholder, input.getAttribute('autocomplete'), input.getAttribute('aria-label')]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return input.autocomplete === 'username' || USERNAME_HINTS.some(hint => text.includes(hint));
  }

  function isUserLoginPage() {
    const title = document.title || '';
    const now = Date.now();
    if (state.isUserLoginPage !== null && title === state.loginPageTitle && now - state.loginPageCheckTime < 3000) return state.isUserLoginPage;
    const bodyText = document.body && (document.body.innerText || document.body.textContent) || '';
    state.isUserLoginPage = /user login/i.test(`${title} ${bodyText}`);
    state.loginPageTitle = title;
    state.loginPageCheckTime = now;
    return state.isUserLoginPage;
  }

  function isLoginContext(input) {
    if (!isUserLoginPage()) return false;
    const form = input && input.form;
    if (form && form.querySelector('input[type="password"]')) return true;
    const container = input && input.closest && input.closest('form, [role="form"], .login, .signin, .sign-in');
    return !!(container && container.querySelector && container.querySelector('input[type="password"]'));
  }

  function getUsernameFields(root = document) {
    return Array.from(root.querySelectorAll('input')).filter(input => isUsernameField(input) && isLoginContext(input));
  }

  function fillUsernameField(input, value) {
    if (!input || !value || input.value) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function ensureUsernameOptions(usernames) {
    if (!document.documentElement || !usernames.length) return null;
    if (!state.usernameOptions) {
      state.usernameOptions = document.createElement('datalist');
      state.usernameOptions.id = 'ca-enhanced-remembered-usernames';
      (document.body || document.documentElement).appendChild(state.usernameOptions);
    }
    state.usernameOptions.replaceChildren(...usernames.map(value => Object.assign(document.createElement('option'), { value })));
    return state.usernameOptions;
  }

  function syncUsernameOptions() {
    const usernames = state.settings.enableRememberUsername ? getRememberedUsernames(state.settings) : [];
    const optionId = state.usernameOptions && state.usernameOptions.id;
    getUsernameFields().forEach(input => {
      if (usernames.length) {
        const options = ensureUsernameOptions(usernames);
        if (options) input.setAttribute('list', options.id);
      } else if (optionId && input.getAttribute('list') === optionId) input.removeAttribute('list');
    });
    if (!usernames.length && state.usernameOptions) state.usernameOptions.replaceChildren();
  }

  function autofillRememberedUsername() {
    const usernames = getRememberedUsernames(state.settings);
    syncUsernameOptions();
    if (!state.settings.enableRememberUsername || !usernames.length) return;
    getUsernameFields().forEach(input => fillUsernameField(input, usernames[0]));
  }

  function rememberUsername(value) {
    const username = cleanText(value);
    if (!state.settings.enableRememberUsername || !username) return;
    const usernames = [username, ...getRememberedUsernames(state.settings).filter(saved => saved.toLowerCase() !== username.toLowerCase())].slice(0, MAX_REMEMBERED_USERNAMES);
    const rememberedUsernames = serializeRememberedUsernames(usernames);
    if (rememberedUsernames === (state.settings.rememberedUsernames || '') && usernames[0] === state.settings.rememberedUsername) return;
    state.settings.rememberedUsername = usernames[0];
    state.settings.rememberedUsernames = rememberedUsernames;
    chrome.storage.sync.set({ rememberedUsername: usernames[0], rememberedUsernames }, () => {
      if (chrome.runtime.lastError) {
        console.error(`${LOG} Username save failed:`, chrome.runtime.lastError);
      }
    });
  }

  function initRememberUsername() {
    autofillRememberedUsername();
    let autofillTimer = 0;
    document.addEventListener('submit', e => safe('Username remember failed', () => {
      if (!state.settings.enableRememberUsername || !e.target || !e.target.querySelector) return;
      const field = getUsernameFields(e.target)[0];
      if (field) rememberUsername(field.value);
    }), true);
    document.addEventListener('change', e => safe('Username remember failed', () => {
      if (e.target && isUsernameField(e.target) && isLoginContext(e.target)) rememberUsername(e.target.value);
    }), true);
    new MutationObserver(() => safe('Username autofill failed', () => {
      state.isUserLoginPage = null;
      clearTimeout(autofillTimer);
      autofillTimer = setTimeout(autofillRememberedUsername, 120);
    })).observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  function initMessages() {
    window.addEventListener(PAGE_ACTION_EVENT, e => safe('Auto action relay failed', () => {
      if (e.detail && e.detail.message) showAutoAction(e.detail.message);
    }));
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => safe('Message action failed', () => {
      if (!msg) return;
      if (msg.action === 'hideColumn') hideSelectedColumn();
      if (msg.action === 'hideRow') hideSelectedRow();
      if (msg.action === 'countNavPrefetchMatches') sendResponse({ navPrefetchMatches: Array.from(document.querySelectorAll('a[href]')).filter(link => matchesNavPrefetchLabel(cleanText(link.textContent).toLowerCase(), parseSimpleList(msg.navPrefetchLabels || state.settings.navPrefetchLabels))).length });
    }));
  }

  function prefetchNavLink(link) {
    const href = link && link.href;
    if (!state.settings.enableNavPrefetch || !href || state.prefetchedHrefs.has(href)) return;
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || url.protocol !== 'https:') return;
      const rel = document.createElement('link');
      rel.rel = 'prefetch';
      rel.as = 'document';
      rel.href = url.href;
      (document.head || document.documentElement).appendChild(rel);
      state.prefetchedHrefs.add(url.href);
    } catch (e) {
      console.warn(`${LOG} Nav prefetch failed:`, e);
    }
  }

  function initNavPrefetch() {
    const maybePrefetch = target => safe('Nav prefetch failed', () => {
      if (!state.settings.enableNavPrefetch || !state.navPrefetchLabels.length) return;
      const link = target && target.closest && target.closest('a[href]');
      const label = cleanText(link && link.textContent).toLowerCase();
      if (!link || !matchesNavPrefetchLabel(label, state.navPrefetchLabels)) return;
      prefetchNavLink(link);
    });
    document.addEventListener('mouseover', e => maybePrefetch(e.target), true);
    document.addEventListener('focusin', e => maybePrefetch(e.target), true);
  }

  function initStorageSync() {
    chrome.storage.onChanged.addListener((changes, area) => safe('Settings sync failed', () => {
      if (area !== 'sync') return;
      const nextSettings = Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]));
      if (Object.keys(nextSettings).length) applySettings(nextSettings);
    }));
  }

  function init() {
    safe('Head hint init failed', ensureHeadHints);
    safe('DNR UI init failed', initDNRUI);
    safe('Escape key init failed', initEscapeKey);
    safe('Table tracking init failed', initTableTracking);
    safe('Remember username init failed', initRememberUsername);
    safe('Nav prefetch init failed', initNavPrefetch);
    safe('Message listener init failed', initMessages);
    safe('Storage sync init failed', initStorageSync);
  }

  injectPageScript();
  syncAnimationMode();
  initHeadFixes();

  chrome.storage.sync.get(DEFAULTS, items => safe('Init failed', () => {
    if (chrome.runtime.lastError) {
      console.error(`${LOG} Failed to load settings:`, chrome.runtime.lastError);
      items = DEFAULTS;
    }
    const boot = () => {
      applySettings(items || DEFAULTS);
      init();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }));
})();
