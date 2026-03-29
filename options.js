const DEFAULTS = {
  dnrList: '',
  enableBlockPendo: true,
  enableBlockTelemetry: true,
  enableBlockAkamai: true,
  blockedHosts: '',
  fixMixedContentFavicon: true,
  suppressWelcomeImage404: true,
  dedupeErrorMessageWriter: true,
  guardHideGooglePopup: true,
  removeUnusedFontPreload: true,
  removeTelemetryHints: true,
  lazyLoadNoncriticalImages: true,
  hideNoncriticalImages: true,
  animationMode: 'reduced',
  enableNavPrefetch: true,
  navPrefetchLabels: 'arrivals\ndepartures\nin-house',
  enableAbortRequests: false,
  abortRequestTimeoutMs: 3500,
  abortRequestPatterns: '',
  enableCacheControl: false,
  cacheControlMaxAgeSeconds: 3600,
  cacheControlPatterns: '',
  enableDNR: true,
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
const fields = {
  dnrList: document.getElementById('dnrList'),
  enableBlockPendo: document.getElementById('enableBlockPendo'),
  enableBlockTelemetry: document.getElementById('enableBlockTelemetry'),
  enableBlockAkamai: document.getElementById('enableBlockAkamai'),
  blockedHosts: document.getElementById('blockedHosts'),
  fixMixedContentFavicon: document.getElementById('fixMixedContentFavicon'),
  suppressWelcomeImage404: document.getElementById('suppressWelcomeImage404'),
  dedupeErrorMessageWriter: document.getElementById('dedupeErrorMessageWriter'),
  guardHideGooglePopup: document.getElementById('guardHideGooglePopup'),
  removeUnusedFontPreload: document.getElementById('removeUnusedFontPreload'),
  removeTelemetryHints: document.getElementById('removeTelemetryHints'),
  lazyLoadNoncriticalImages: document.getElementById('lazyLoadNoncriticalImages'),
  hideNoncriticalImages: document.getElementById('hideNoncriticalImages'),
  animationMode: document.getElementById('animationMode'),
  enableNavPrefetch: document.getElementById('enableNavPrefetch'),
  navPrefetchLabels: document.getElementById('navPrefetchLabels'),
  enableAbortRequests: document.getElementById('enableAbortRequests'),
  abortRequestTimeoutMs: document.getElementById('abortRequestTimeoutMs'),
  abortRequestPatterns: document.getElementById('abortRequestPatterns'),
  enableCacheControl: document.getElementById('enableCacheControl'),
  cacheControlMaxAgeSeconds: document.getElementById('cacheControlMaxAgeSeconds'),
  cacheControlPatterns: document.getElementById('cacheControlPatterns'),
  enableDNR: document.getElementById('enableDNR'),
  enableEscapeKey: document.getElementById('enableEscapeKey'),
  enableHideColumn: document.getElementById('enableHideColumn'),
  enableHideRow: document.getElementById('enableHideRow'),
  enableRememberUsername: document.getElementById('enableRememberUsername'),
  rememberedUsernames: document.getElementById('rememberedUsernames'),
  dnrTooltipText: document.getElementById('dnrTooltipText'),
  dnrHighlightColor: document.getElementById('dnrHighlightColor'),
  backLinkText: document.getElementById('backLinkText'),
  hideColumnMenuText: document.getElementById('hideColumnMenuText'),
  hideRowMenuText: document.getElementById('hideRowMenuText')
};
const ui = {
  saved: document.getElementById('saved'),
  dnrCount: document.getElementById('dnrCount'),
  rememberedCount: document.getElementById('rememberedCount'),
  navPrefetchCount: document.getElementById('navPrefetchCount'),
  navPrefetchMatches: document.getElementById('navPrefetchMatches')
};
const formFields = Object.fromEntries(Object.entries(fields).filter(([, field]) => field && field.matches && field.matches('input, textarea, select')));
const tabButtons = Array.from(document.querySelectorAll('[data-tab-button]'));
const tabPanels = Array.from(document.querySelectorAll('[data-tab-panel]'));
const statusFields = {
  enableAbortRequests: document.getElementById('enableAbortRequestsStatus'),
  enableCacheControl: document.getElementById('enableCacheControlStatus'),
  enableNavPrefetch: document.getElementById('enableNavPrefetchStatus'),
  blockedHosts: document.getElementById('blockedHostsStatus'),
  abortRequestTimeoutMs: document.getElementById('abortRequestTimeoutMsStatus'),
  abortRequestPatterns: document.getElementById('abortRequestPatternsStatus'),
  cacheControlMaxAgeSeconds: document.getElementById('cacheControlMaxAgeSecondsStatus'),
  cacheControlPatterns: document.getElementById('cacheControlPatternsStatus'),
  navPrefetchLabels: document.getElementById('navPrefetchLabelsStatus'),
  dnrList: document.getElementById('dnrListStatus')
};
const RESERVED_HOSTS = new Set(['choiceadvantage.com', 'remoteaccess.choiceadvantage.com', 'content.nps.skytouchnps.com', 's.go-mpulse.net', 's2.go-mpulse.net', 'p11.techlab-cdn.com']);
const MAX_CUSTOM_HOSTS = 50;
const MAX_REMEMBERED_USERNAMES = 20;
let saveTimer = 0;
let savedTimer = 0;
let previewTimer = 0;
let activeTab = 'dnr';

function setActiveTab(name) {
  activeTab = name;
  tabButtons.forEach(button => {
    const active = button.dataset.tabButton === name;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
    button.tabIndex = active ? 0 : -1;
  });
  tabPanels.forEach(panel => { panel.hidden = panel.dataset.tabPanel !== name; });
  if (name === 'network') scheduleNavPrefetchPreview();
}

function showSaved() {
  if (!ui.saved) return;
  clearTimeout(savedTimer);
  ui.saved.classList.add('show');
  savedTimer = setTimeout(() => ui.saved.classList.remove('show'), 1000);
}

function splitLoose(value) {
  return String(value || '').split('\n').flatMap(line => line.split(',')).map(part => part.replace(/#.*/, '').trim()).filter(Boolean);
}

function splitLines(value) {
  return String(value || '').split('\n').map(line => line.replace(/#.*/, '').trim()).filter(Boolean);
}

function parseRememberedUsernames(value) {
  const seen = new Set();
  return splitLines(value).filter(username => {
    const key = username.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_REMEMBERED_USERNAMES);
}

function getPrimaryRememberedUsername(value) {
  return parseRememberedUsernames(value)[0] || '';
}

function normalizeHost(host) {
  return String(host || '').trim().replace(/#.*/, '').replace(/[,\s]+$/, '').toLowerCase().replace(/^\*\./, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

function setStatus(field, message) {
  const status = statusFields[field];
  if (!status) return;
  if (!message) {
    status.hidden = true;
    status.classList.remove('show');
    status.title = '';
    return;
  }
  status.hidden = false;
  status.classList.add('show');
  status.title = message;
}

function setText(node, value) {
  if (node) node.textContent = value;
}

function setCount(node, count, singular, plural = `${singular}s`) {
  setText(node, `${count} ${count === 1 ? singular : plural}`);
}

function renderNavPrefetchPreview(message) {
  setText(ui.navPrefetchMatches, message);
}

function updateNavPrefetchPreview() {
  const labels = splitLoose(fields.navPrefetchLabels && fields.navPrefetchLabels.value).filter(value => value.length >= 3);
  setCount(ui.navPrefetchCount, labels.length, 'label');
  if (!fields.enableNavPrefetch.checked) return renderNavPrefetchPreview('Enable nav prefetch to preview matches.');
  if (!labels.length) return renderNavPrefetchPreview('Add labels to preview matches on the current page.');
  if (!chrome.tabs || !chrome.tabs.query) return renderNavPrefetchPreview('Page preview unavailable here.');
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs && tabs[0];
    if (chrome.runtime.lastError || !tab || !tab.id) return renderNavPrefetchPreview('Open a ChoiceADVANTAGE page to preview matches.');
    chrome.tabs.sendMessage(tab.id, { action: 'countNavPrefetchMatches', navPrefetchLabels: labels.join('\n') }, response => {
      if (chrome.runtime.lastError || !response || typeof response.navPrefetchMatches !== 'number') return renderNavPrefetchPreview('Open a ChoiceADVANTAGE page to preview matches.');
      const count = response.navPrefetchMatches;
      renderNavPrefetchPreview(`${count} matching ${count === 1 ? 'link' : 'links'} on this page.`);
    });
  });
}

function scheduleNavPrefetchPreview() {
  if (activeTab !== 'network') return;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(updateNavPrefetchPreview, 140);
}

function refreshStatuses() {
  const blocked = splitLoose(fields.blockedHosts && fields.blockedHosts.value);
  const seenHosts = new Set();
  let blockedIssues = 0;
  blocked.forEach(entry => {
    const host = normalizeHost(entry);
    if (!host || RESERVED_HOSTS.has(host) || seenHosts.has(host)) blockedIssues += 1;
    else seenHosts.add(host);
  });
  const blockedWarnings = [];
  if (seenHosts.size > MAX_CUSTOM_HOSTS) blockedWarnings.push(`Only the first ${MAX_CUSTOM_HOSTS} valid hosts are used.`);
  if (blockedIssues) blockedWarnings.push('Some entries are ignored, duplicated, or reserved.');
  setStatus('blockedHosts', blockedWarnings.join(' '));

  const timeout = Number(fields.abortRequestTimeoutMs && fields.abortRequestTimeoutMs.value);
  setStatus('abortRequestTimeoutMs', !Number.isInteger(timeout) || timeout < 1 ? 'Must be a positive whole number.' : '');

  const abortPatterns = splitLoose(fields.abortRequestPatterns && fields.abortRequestPatterns.value);
  const validAbortPatterns = abortPatterns.filter(part => part.length >= 3);
  setStatus('abortRequestPatterns', abortPatterns.length && validAbortPatterns.length !== abortPatterns.length ? 'Entries shorter than 3 characters are ignored.' : '');

  const cacheMaxAge = Number(fields.cacheControlMaxAgeSeconds && fields.cacheControlMaxAgeSeconds.value);
  setStatus('cacheControlMaxAgeSeconds', !Number.isInteger(cacheMaxAge) || cacheMaxAge < 1 ? 'Must be a positive whole number.' : '');

  const cachePatterns = splitLoose(fields.cacheControlPatterns && fields.cacheControlPatterns.value);
  const validCachePatterns = cachePatterns.filter(part => part.length >= 3);
  setStatus('cacheControlPatterns', cachePatterns.length && validCachePatterns.length !== cachePatterns.length ? 'Entries shorter than 3 characters are ignored.' : '');

  const navLabels = splitLoose(fields.navPrefetchLabels && fields.navPrefetchLabels.value);
  const validNavLabels = navLabels.filter(part => part.length >= 3);
  setStatus('navPrefetchLabels', navLabels.length && validNavLabels.length !== navLabels.length ? 'Entries shorter than 3 characters are ignored.' : '');

  const dnrLines = String(fields.dnrList && fields.dnrList.value || '').split('\n').map(line => line.trim()).filter(Boolean);
  const validDnrLines = dnrLines.filter(line => line.replace(/,/g, ' ').split(/\s+/).filter(Boolean).length >= 2);
  setCount(ui.dnrCount, dnrLines.length, 'entry', 'entries');
  setStatus('dnrList', dnrLines.length && validDnrLines.length !== dnrLines.length ? 'Some lines need both first and last names.' : '');

  const rememberedCount = parseRememberedUsernames(fields.rememberedUsernames && fields.rememberedUsernames.value).length;
  setText(ui.rememberedCount, `${rememberedCount} saved${rememberedCount >= MAX_REMEMBERED_USERNAMES ? ` · max ${MAX_REMEMBERED_USERNAMES}` : ''}`);

  setStatus('enableAbortRequests',
    fields.enableAbortRequests && fields.enableAbortRequests.checked
      ? (!validAbortPatterns.length ? 'Add at least one URL pattern.' : '')
      : (abortPatterns.length ? 'Disabled, so listed patterns will not apply.' : '')
  );
  setStatus('enableNavPrefetch',
    fields.enableNavPrefetch && fields.enableNavPrefetch.checked
      ? (!validNavLabels.length ? 'Add at least one label.' : '')
      : (validNavLabels.length ? 'Disabled, so matching links will not prefetch.' : '')
  );
  setStatus('enableCacheControl',
    fields.enableCacheControl && fields.enableCacheControl.checked
      ? (!validCachePatterns.length ? 'Add at least one URL pattern.' : '')
      : (validCachePatterns.length ? 'Disabled, so matching requests will not get cache hints.' : '')
  );

  scheduleNavPrefetchPreview();
}

function syncUI() {
  if (fields.navPrefetchLabels) fields.navPrefetchLabels.disabled = !fields.enableNavPrefetch.checked;
  if (fields.abortRequestTimeoutMs) fields.abortRequestTimeoutMs.disabled = !fields.enableAbortRequests.checked;
  if (fields.abortRequestPatterns) fields.abortRequestPatterns.disabled = !fields.enableAbortRequests.checked;
  if (fields.cacheControlMaxAgeSeconds) fields.cacheControlMaxAgeSeconds.disabled = !fields.enableCacheControl.checked;
  if (fields.cacheControlPatterns) fields.cacheControlPatterns.disabled = !fields.enableCacheControl.checked;
  if (fields.dnrList && fields.enableDNR) fields.dnrList.disabled = !fields.enableDNR.checked;
  if (fields.dnrTooltipText) fields.dnrTooltipText.disabled = !fields.enableDNR.checked;
  if (fields.dnrHighlightColor) fields.dnrHighlightColor.disabled = !fields.enableDNR.checked;
  if (fields.hideColumnMenuText) fields.hideColumnMenuText.disabled = !fields.enableHideColumn.checked;
  if (fields.hideRowMenuText) fields.hideRowMenuText.disabled = !fields.enableHideRow.checked;
  if (fields.rememberedUsernames) fields.rememberedUsernames.disabled = !fields.enableRememberUsername.checked;
  refreshStatuses();
}

function readForm() {
  const rememberedUsernames = fields.rememberedUsernames ? parseRememberedUsernames(fields.rememberedUsernames.value || '').join('\n') : '';
  return {
    dnrList: fields.dnrList ? fields.dnrList.value || '' : '',
    enableBlockPendo: !!(fields.enableBlockPendo && fields.enableBlockPendo.checked),
    enableBlockTelemetry: !!(fields.enableBlockTelemetry && fields.enableBlockTelemetry.checked),
    enableBlockAkamai: !!(fields.enableBlockAkamai && fields.enableBlockAkamai.checked),
    blockedHosts: fields.blockedHosts ? fields.blockedHosts.value || '' : '',
    fixMixedContentFavicon: !!(fields.fixMixedContentFavicon && fields.fixMixedContentFavicon.checked),
    suppressWelcomeImage404: !!(fields.suppressWelcomeImage404 && fields.suppressWelcomeImage404.checked),
    dedupeErrorMessageWriter: !!(fields.dedupeErrorMessageWriter && fields.dedupeErrorMessageWriter.checked),
    guardHideGooglePopup: !!(fields.guardHideGooglePopup && fields.guardHideGooglePopup.checked),
    removeUnusedFontPreload: !!(fields.removeUnusedFontPreload && fields.removeUnusedFontPreload.checked),
    removeTelemetryHints: !!(fields.removeTelemetryHints && fields.removeTelemetryHints.checked),
    lazyLoadNoncriticalImages: !!(fields.lazyLoadNoncriticalImages && fields.lazyLoadNoncriticalImages.checked),
    hideNoncriticalImages: !!(fields.hideNoncriticalImages && fields.hideNoncriticalImages.checked),
    animationMode: fields.animationMode ? fields.animationMode.value || DEFAULTS.animationMode : DEFAULTS.animationMode,
    enableNavPrefetch: !!(fields.enableNavPrefetch && fields.enableNavPrefetch.checked),
    navPrefetchLabels: fields.navPrefetchLabels ? fields.navPrefetchLabels.value || '' : '',
    enableAbortRequests: !!(fields.enableAbortRequests && fields.enableAbortRequests.checked),
    abortRequestTimeoutMs: fields.abortRequestTimeoutMs ? Math.max(1, parseInt(fields.abortRequestTimeoutMs.value || DEFAULTS.abortRequestTimeoutMs, 10) || DEFAULTS.abortRequestTimeoutMs) : DEFAULTS.abortRequestTimeoutMs,
    abortRequestPatterns: fields.abortRequestPatterns ? fields.abortRequestPatterns.value || '' : '',
    enableCacheControl: !!(fields.enableCacheControl && fields.enableCacheControl.checked),
    cacheControlMaxAgeSeconds: fields.cacheControlMaxAgeSeconds ? Math.max(1, parseInt(fields.cacheControlMaxAgeSeconds.value || DEFAULTS.cacheControlMaxAgeSeconds, 10) || DEFAULTS.cacheControlMaxAgeSeconds) : DEFAULTS.cacheControlMaxAgeSeconds,
    cacheControlPatterns: fields.cacheControlPatterns ? fields.cacheControlPatterns.value || '' : '',
    enableDNR: !!(fields.enableDNR && fields.enableDNR.checked),
    enableEscapeKey: !!(fields.enableEscapeKey && fields.enableEscapeKey.checked),
    enableHideColumn: !!(fields.enableHideColumn && fields.enableHideColumn.checked),
    enableHideRow: !!(fields.enableHideRow && fields.enableHideRow.checked),
    enableRememberUsername: !!(fields.enableRememberUsername && fields.enableRememberUsername.checked),
    rememberedUsernames,
    rememberedUsername: getPrimaryRememberedUsername(rememberedUsernames),
    dnrTooltipText: fields.dnrTooltipText ? fields.dnrTooltipText.value || DEFAULTS.dnrTooltipText : DEFAULTS.dnrTooltipText,
    dnrHighlightColor: fields.dnrHighlightColor ? fields.dnrHighlightColor.value || DEFAULTS.dnrHighlightColor : DEFAULTS.dnrHighlightColor,
    backLinkText: fields.backLinkText ? fields.backLinkText.value || DEFAULTS.backLinkText : DEFAULTS.backLinkText,
    hideColumnMenuText: fields.hideColumnMenuText ? fields.hideColumnMenuText.value || DEFAULTS.hideColumnMenuText : DEFAULTS.hideColumnMenuText,
    hideRowMenuText: fields.hideRowMenuText ? fields.hideRowMenuText.value || DEFAULTS.hideRowMenuText : DEFAULTS.hideRowMenuText
  };
}

function saveSettings() {
  chrome.storage.sync.set(readForm(), () => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Save failed:', chrome.runtime.lastError);
      return;
    }
    syncUI();
    showSaved();
  });
}

chrome.storage.sync.get(DEFAULTS, items => {
  if (chrome.runtime.lastError) {
    console.error('[CA Enhanced] Failed to load settings:', chrome.runtime.lastError);
    return;
  }
  const values = { ...DEFAULTS, ...items, rememberedUsernames: items.rememberedUsernames || items.rememberedUsername || '' };
  try {
    Object.entries(formFields).forEach(([key, field]) => {
      if (field.type === 'checkbox') field.checked = !!values[key];
      else field.value = values[key] || '';
    });
    setActiveTab('dnr');
    syncUI();
  } catch (e) {
    console.error('[CA Enhanced] Failed to load settings:', e);
  }
});

tabButtons.forEach(button => button.addEventListener('click', () => setActiveTab(button.dataset.tabButton)));
tabButtons.forEach((button, index) => button.addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const nextIndex =
    e.key === 'Home' ? 0 :
    e.key === 'End' ? tabButtons.length - 1 :
    (index + (e.key === 'ArrowRight' ? 1 : -1) + tabButtons.length) % tabButtons.length;
  const nextButton = tabButtons[nextIndex];
  if (!nextButton) return;
  setActiveTab(nextButton.dataset.tabButton);
  nextButton.focus();
}));

Object.values(formFields).forEach(field => {
  const eventName = field.matches('input[type="checkbox"], select') ? 'change' : 'input';
  field.addEventListener(eventName, () => {
    clearTimeout(saveTimer);
    if (field.matches('input[type="checkbox"]')) syncUI();
    else refreshStatuses();
    saveTimer = setTimeout(saveSettings, field.matches('input[type="checkbox"], select') ? 0 : 250);
  });
});
