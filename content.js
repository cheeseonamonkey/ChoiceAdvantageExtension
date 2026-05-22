// ChoiceAdvantage Enhanced - focused page helpers.
(function() {
  'use strict';

  const { DEFAULTS, cleanText } = globalThis.CA_ENHANCED_SETTINGS;
  const LOG = '[CA Enhanced]';
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
  const state = { settings: { ...DEFAULTS }, dnrRules: [], tooltip: null, activeLink: null, rescanTimer: 0, editableTarget: null };

  const safe = (label, fn) => {
    try {
      return fn();
    } catch (error) {
      console.error(`${LOG} ${label}:`, error);
    }
  };
  const settingText = (key, fallback) => cleanText(state.settings[key]) || fallback;

  function normalizeName(name) {
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
    } catch (error) {
      return String(name).toUpperCase().trim();
    }
  }

  function parseName(name) {
    const normalized = normalizeName(name);
    const parts = normalized.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length < 2) return null;
    const first = normalized.includes(',') ? parts[1] : parts[0];
    const last = normalized.includes(',') ? parts[0] : parts[parts.length - 1];
    return { first, last, label: `${last}, ${first}` };
  }

  function findDNRMatch(text) {
    if (!state.settings.enableDNR || !state.dnrRules.length || !text) return null;
    const parts = normalizeName(text).replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (parts.length < 2) return null;
    const words = new Set(parts);
    return state.dnrRules.find(rule => words.has(rule.first) && words.has(rule.last)) || null;
  }

  function ensureTooltip() {
    if (state.tooltip || !document.body) return state.tooltip;
    state.tooltip = document.createElement('div');
    state.tooltip.textContent = settingText('dnrTooltipText', DEFAULTS.dnrTooltipText);
    Object.assign(state.tooltip.style, TOOLTIP_STYLE);
    document.body.appendChild(state.tooltip);
    return state.tooltip;
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
    }));
    if (!state.settings.enableDNR) hideTooltip();
  }

  function scheduleDNRRefresh() {
    if (!state.settings.enableDNR || state.rescanTimer) return;
    state.rescanTimer = window.setTimeout(() => {
      state.rescanTimer = 0;
      safe('DNR highlighting failed', refreshDNRLinks);
    }, 20);
  }

  function applySettings(nextSettings) {
    state.settings = { ...state.settings, ...nextSettings };
    state.dnrRules = String(state.settings.dnrList || '').split('\n').map(parseName).filter(Boolean);
    if (state.tooltip) state.tooltip.textContent = settingText('dnrTooltipText', DEFAULTS.dnrTooltipText);
    safe('DNR highlighting failed', refreshDNRLinks);
  }

  const findDNRLink = target => target && target.closest ? target.closest('a[data-ca-dnr]') : null;

  function initDNRUI() {
    document.addEventListener('mouseover', event => {
      const link = findDNRLink(event.target);
      if (link) showTooltip(link);
    });
    document.addEventListener('mouseout', event => {
      const link = findDNRLink(event.target);
      if (link) hideTooltip(link);
    });
    document.addEventListener('focusin', event => {
      const link = findDNRLink(event.target);
      if (link) showTooltip(link);
    });
    document.addEventListener('focusout', event => {
      const link = findDNRLink(event.target);
      if (link) hideTooltip(link);
    });
    window.addEventListener('scroll', () => state.activeLink && positionTooltip(state.activeLink), true);
    window.addEventListener('resize', () => state.activeLink && positionTooltip(state.activeLink));
    new MutationObserver(scheduleDNRRefresh).observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  function isEditableTarget(target) {
    if (!target || target.nodeType !== Node.ELEMENT_NODE) return false;
    return !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"], [role="menu"]');
  }

  function isVisible(link) {
    return !!(link && link.getClientRects().length && getComputedStyle(link).visibility !== 'hidden');
  }

  function initEscapeKey() {
    document.addEventListener('keydown', event => safe('Escape key failed', () => {
      if (!state.settings.enableEscapeKey || event.key !== 'Escape' || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey || isEditableTarget(event.target)) return;
      const text = settingText('backLinkText', DEFAULTS.backLinkText).toLowerCase();
      const backLink = Array.from(document.querySelectorAll('a')).find(link => isVisible(link) && cleanText(link.textContent).toLowerCase() === text);
      if (!backLink) return;
      event.preventDefault();
      backLink.click();
    }));
  }

  function findEditableField(target) {
    const field = target && target.closest ? target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') : null;
    if (!field || field.disabled || field.readOnly || field.type === 'password') return null;
    return field.isContentEditable || /^(text|search|tel|url|email|number|month)?$/.test(field.type) || /^(TEXTAREA|SELECT)$/.test(field.tagName) ? field : null;
  }

  function setEditableTarget(target) {
    state.editableTarget = findEditableField(target);
  }

  function selectTestData(field, value) {
    const option = Array.from(field.options).find(item => [item.value, item.label, item.textContent].some(text => cleanText(text).toLowerCase() === cleanText(value).toLowerCase()));
    if (!option) return;
    field.value = option.value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function editContent(field, value) {
    const selection = window.getSelection();
    const range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    field.focus();
    if (!range || !field.contains(range.commonAncestorContainer)) {
      field.append(value);
    } else {
      range.deleteContents();
      const text = document.createTextNode(value);
      range.insertNode(text);
      range.setStartAfter(text);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  function insertTestData(value) {
    const field = state.editableTarget && document.contains(state.editableTarget) ? state.editableTarget : findEditableField(document.activeElement);
    if (!state.settings.enableTestData || !field || !value) return;
    if (field.tagName === 'SELECT') return selectTestData(field, value);
    if (field.isContentEditable) return editContent(field, value);
    if (field.type === 'month' && value === '12/34') value = '2034-12';
    const setter = Object.getOwnPropertyDescriptor(field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')?.set;
    const start = typeof field.selectionStart === 'number' ? field.selectionStart : 0;
    const end = typeof field.selectionEnd === 'number' ? field.selectionEnd : field.value.length;
    const nextValue = `${field.value.slice(0, start)}${value}${field.value.slice(end)}`;
    if (setter) setter.call(field, nextValue);
    else field.value = nextValue;
    field.focus();
    try {
      if (field.setSelectionRange) field.setSelectionRange(start + value.length, start + value.length);
    } catch (error) {}
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function initTestData() {
    document.addEventListener('contextmenu', event => setEditableTarget(event.target), true);
    document.addEventListener('focusin', event => setEditableTarget(event.target), true);
    chrome.runtime.onMessage.addListener(message => safe('Test data insert failed', () => {
      if (message && message.action === 'insertTestData') insertTestData(message.value);
    }));
  }

  function initStorageSync() {
    chrome.storage.onChanged.addListener((changes, area) => safe('Settings sync failed', () => {
      if (area !== 'sync') return;
      const nextSettings = Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]));
      if (Object.keys(nextSettings).length) applySettings(nextSettings);
    }));
  }

  chrome.storage.sync.get(DEFAULTS, items => safe('Init failed', () => {
    if (chrome.runtime.lastError) {
      console.error(`${LOG} Failed to load settings:`, chrome.runtime.lastError);
      items = DEFAULTS;
    }
    const boot = () => {
      applySettings(items || DEFAULTS);
      initDNRUI();
      initEscapeKey();
      initTestData();
      initStorageSync();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }));
})();
