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
  const GUEST_LABELS = {
    firstName: ['first name'],
    lastName: ['last name'],
    address1: ['address 1', 'address line 1'],
    city: ['city'],
    state: ['state'],
    zip: ['postal code', 'zip code', 'zip'],
    country: ['country'],
    email: ['e-mail', 'email'],
    phone: ['phone']
  };
  const state = { settings: { ...DEFAULTS }, dnrRules: [], tooltip: null, activeLink: null, rescanTimer: 0 };

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

  function backLinkRegex() {
    try {
      return new RegExp(settingText('backLinkText', DEFAULTS.backLinkText), 'i');
    } catch (error) {
      return null;
    }
  }

  function clickBackLink(link) {
    const motion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!link.animate || motion) return link.click();
    link.animate([
      { outline: '0 solid rgba(47, 75, 63, 0)', backgroundColor: 'rgba(47, 75, 63, 0)' },
      { outline: '2px solid rgba(47, 75, 63, .22)', backgroundColor: 'rgba(47, 75, 63, .08)' },
      { outline: '0 solid rgba(47, 75, 63, 0)', backgroundColor: 'rgba(47, 75, 63, 0)' }
    ], { duration: 120, easing: 'ease-out' }).finished.finally(() => link.click());
  }

  function initEscapeKey() {
    document.addEventListener('keydown', event => safe('Escape key failed', () => {
      if (!state.settings.enableEscapeKey || event.key !== 'Escape' || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey || isEditableTarget(event.target)) return;
      const pattern = backLinkRegex();
      const backLink = pattern && Array.from(document.querySelectorAll('a')).find(link => isVisible(link) && pattern.test(cleanText(link.textContent)));
      if (!backLink) return;
      event.preventDefault();
      clickBackLink(backLink);
    }));
  }

  function findEditableField(target) {
    const field = target && target.closest ? target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') : null;
    if (!field || field.disabled || field.readOnly || field.type === 'password') return null;
    return field.isContentEditable || /^(text|search|tel|url|email|number|month)?$/.test(field.type) || /^(TEXTAREA|SELECT)$/.test(field.tagName) ? field : null;
  }

  function selectTestData(field, value) {
    const option = Array.from(field.options).find(item => [item.value, item.label, item.textContent].some(text => cleanText(text).toLowerCase() === cleanText(value).toLowerCase()));
    if (!option) return;
    field.value = option.value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setFieldValue(field, value, append = false) {
    if (!field || value == null || value === '') return false;
    if (field.tagName === 'SELECT') {
      selectTestData(field, value);
      return field.value === value || Array.from(field.options).some(option => option.selected && [option.label, option.textContent].some(text => cleanText(text).toLowerCase() === cleanText(value).toLowerCase()));
    }
    if (field.isContentEditable) {
      if (!append) field.textContent = '';
      editContent(field, String(value));
      return true;
    }
    const setter = Object.getOwnPropertyDescriptor(field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')?.set;
    const start = append && typeof field.selectionStart === 'number' ? field.selectionStart : 0;
    const end = append && typeof field.selectionEnd === 'number' ? field.selectionEnd : field.value.length;
    const nextValue = append ? `${field.value.slice(0, start)}${value}${field.value.slice(end)}` : String(value);
    if (setter) setter.call(field, nextValue);
    else field.value = nextValue;
    field.focus();
    try {
      if (append && field.setSelectionRange) field.setSelectionRange(start + String(value).length, start + String(value).length);
    } catch (error) {}
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
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

  function parseSelectorMap(value) {
    return String(value || '').split('\n').reduce((map, line) => {
      const match = line.match(/^\s*([\w-]+)\s*=\s*(.+)$/);
      if (match) map[match[1]] = match[2].split(',').map(selector => selector.trim()).filter(Boolean);
      return map;
    }, {});
  }

  function fieldByLabel(key) {
    const wanted = GUEST_LABELS[key] || [];
    return Array.from(document.querySelectorAll('label')).map(label => {
      const text = cleanText(label.textContent).replace(/\*/g, '').replace(/:$/, '').toLowerCase();
      if (!wanted.some(name => text === name)) return null;
      const row = label.closest('.CHI_Row, tr, fieldset, div') || label.parentElement;
      const fields = Array.from((row || document).querySelectorAll('input, textarea, select')).filter(field => field.type !== 'hidden' && findEditableField(field));
      return fields.find(field => !/decoy/i.test(field.name || field.id || '')) || null;
    }).find(Boolean);
  }

  function fieldBySelectors(selectors) {
    return selectors.map(selector => {
      try {
        return document.querySelector(selector);
      } catch (error) {
        return null;
      }
    }).find(findEditableField);
  }

  function fillGuestProfile(profile) {
    if (!state.settings.enableTestData || !profile) return;
    const selectors = parseSelectorMap(state.settings.guestProfileSelectors || DEFAULTS.guestProfileSelectors);
    Object.entries(profile).forEach(([key, value]) => setFieldValue(fieldBySelectors(selectors[key] || []) || fieldByLabel(key), value));
  }

  function initTestData() {
    chrome.runtime.onMessage.addListener(message => safe('Test data insert failed', () => {
      if (message && message.action === 'fillGuestProfile') fillGuestProfile(message.profile);
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
