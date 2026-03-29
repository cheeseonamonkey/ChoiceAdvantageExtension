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
  hideNoncriticalImages: true,
  animationMode: 'reduced',
  enableNavPrefetch: true,
  navPrefetchLabels: 'arrivals\ndepartures\nin-house',
  enableAbortRequests: false,
  abortRequestTimeoutMs: 2500,
  abortRequestPatterns: '',
  enableDNR: true,
  enableEscapeKey: true,
  enableHideColumn: true,
  enableHideRow: true,
  enableRememberUsername: true,
  rememberedUsername: '',
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
  hideNoncriticalImages: document.getElementById('hideNoncriticalImages'),
  animationMode: document.getElementById('animationMode'),
  enableNavPrefetch: document.getElementById('enableNavPrefetch'),
  navPrefetchLabels: document.getElementById('navPrefetchLabels'),
  enableAbortRequests: document.getElementById('enableAbortRequests'),
  abortRequestTimeoutMs: document.getElementById('abortRequestTimeoutMs'),
  abortRequestPatterns: document.getElementById('abortRequestPatterns'),
  enableDNR: document.getElementById('enableDNR'),
  enableEscapeKey: document.getElementById('enableEscapeKey'),
  enableHideColumn: document.getElementById('enableHideColumn'),
  enableHideRow: document.getElementById('enableHideRow'),
  enableRememberUsername: document.getElementById('enableRememberUsername'),
  rememberedUsername: document.getElementById('rememberedUsername'),
  dnrTooltipText: document.getElementById('dnrTooltipText'),
  dnrHighlightColor: document.getElementById('dnrHighlightColor'),
  backLinkText: document.getElementById('backLinkText'),
  hideColumnMenuText: document.getElementById('hideColumnMenuText'),
  hideRowMenuText: document.getElementById('hideRowMenuText'),
  dnrCount: document.getElementById('dnrCount')
};
const statusFields = {
  enableAbortRequests: document.getElementById('enableAbortRequestsStatus'),
  enableNavPrefetch: document.getElementById('enableNavPrefetchStatus'),
  blockedHosts: document.getElementById('blockedHostsStatus'),
  abortRequestTimeoutMs: document.getElementById('abortRequestTimeoutMsStatus'),
  abortRequestPatterns: document.getElementById('abortRequestPatternsStatus'),
  navPrefetchLabels: document.getElementById('navPrefetchLabelsStatus'),
  dnrList: document.getElementById('dnrListStatus')
};
const RESERVED_HOSTS = new Set(['choiceadvantage.com', 'remoteaccess.choiceadvantage.com', 'content.nps.skytouchnps.com', 's.go-mpulse.net', 's2.go-mpulse.net', 'p11.techlab-cdn.com']);
const MAX_CUSTOM_HOSTS = 50;
const saved = document.getElementById('saved');
let saveTimer = 0;
let savedTimer = 0;

function showSaved() {
  if (!saved) return;
  clearTimeout(savedTimer);
  saved.classList.add('show');
  savedTimer = setTimeout(() => saved.classList.remove('show'), 1000);
}

function splitLoose(value) {
  return String(value || '').split('\n').flatMap(line => line.split(',')).map(part => part.replace(/#.*/, '').trim()).filter(Boolean);
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

  const navLabels = splitLoose(fields.navPrefetchLabels && fields.navPrefetchLabels.value);
  const validNavLabels = navLabels.filter(part => part.length >= 3);
  setStatus('navPrefetchLabels', navLabels.length && validNavLabels.length !== navLabels.length ? 'Entries shorter than 3 characters are ignored.' : '');

  const dnrLines = String(fields.dnrList && fields.dnrList.value || '').split('\n').map(line => line.trim()).filter(Boolean);
  const validDnrLines = dnrLines.filter(line => {
    const parts = line.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    return parts.length >= 2;
  });
  if (fields.dnrCount) fields.dnrCount.textContent = `${dnrLines.length} ${dnrLines.length === 1 ? 'entry' : 'entries'}`;
  setStatus('dnrList', dnrLines.length && validDnrLines.length !== dnrLines.length ? 'Some lines need both first and last names.' : '');

  setStatus('enableAbortRequests',
    fields.enableAbortRequests && fields.enableAbortRequests.checked
      ? (!validAbortPatterns.length ? 'Add at least one URL pattern.' : '')
      : (abortPatterns.length ? 'Disabled, so listed patterns will not apply.' : '')
  );
  setStatus('enableNavPrefetch',
    fields.enableNavPrefetch && fields.enableNavPrefetch.checked
      ? (!validNavLabels.length ? 'Add at least one label.' : '')
      : (navLabels.length ? 'Disabled, so listed labels will not prefetch.' : '')
  );
}

function syncUI() {
  if (fields.navPrefetchLabels) fields.navPrefetchLabels.disabled = !fields.enableNavPrefetch.checked;
  if (fields.abortRequestTimeoutMs) fields.abortRequestTimeoutMs.disabled = !fields.enableAbortRequests.checked;
  if (fields.abortRequestPatterns) fields.abortRequestPatterns.disabled = !fields.enableAbortRequests.checked;
  if (fields.dnrList && fields.enableDNR) fields.dnrList.disabled = !fields.enableDNR.checked;
  if (fields.dnrTooltipText) fields.dnrTooltipText.disabled = !fields.enableDNR.checked;
  if (fields.dnrHighlightColor) fields.dnrHighlightColor.disabled = !fields.enableDNR.checked;
  if (fields.hideColumnMenuText) fields.hideColumnMenuText.disabled = !fields.enableHideColumn.checked;
  if (fields.hideRowMenuText) fields.hideRowMenuText.disabled = !fields.enableHideRow.checked;
  if (fields.rememberedUsername) fields.rememberedUsername.disabled = !fields.enableRememberUsername.checked;
  refreshStatuses();
}

function readForm() {
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
    hideNoncriticalImages: !!(fields.hideNoncriticalImages && fields.hideNoncriticalImages.checked),
    animationMode: fields.animationMode ? fields.animationMode.value || DEFAULTS.animationMode : DEFAULTS.animationMode,
    enableNavPrefetch: !!(fields.enableNavPrefetch && fields.enableNavPrefetch.checked),
    navPrefetchLabels: fields.navPrefetchLabels ? fields.navPrefetchLabels.value || '' : '',
    enableAbortRequests: !!(fields.enableAbortRequests && fields.enableAbortRequests.checked),
    abortRequestTimeoutMs: fields.abortRequestTimeoutMs ? Math.max(1, parseInt(fields.abortRequestTimeoutMs.value || DEFAULTS.abortRequestTimeoutMs, 10) || DEFAULTS.abortRequestTimeoutMs) : DEFAULTS.abortRequestTimeoutMs,
    abortRequestPatterns: fields.abortRequestPatterns ? fields.abortRequestPatterns.value || '' : '',
    enableDNR: !!(fields.enableDNR && fields.enableDNR.checked),
    enableEscapeKey: !!(fields.enableEscapeKey && fields.enableEscapeKey.checked),
    enableHideColumn: !!(fields.enableHideColumn && fields.enableHideColumn.checked),
    enableHideRow: !!(fields.enableHideRow && fields.enableHideRow.checked),
    enableRememberUsername: !!(fields.enableRememberUsername && fields.enableRememberUsername.checked),
    rememberedUsername: fields.rememberedUsername ? fields.rememberedUsername.value || '' : '',
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
  try {
    Object.entries(fields).forEach(([key, field]) => {
      if (!field) return;
      if (field.type === 'checkbox') field.checked = !!items[key];
      else field.value = items[key] || '';
    });
    syncUI();
  } catch (e) {
    console.error('[CA Enhanced] Failed to load settings:', e);
  }
});

Object.values(fields).forEach(field => {
  if (!field) return;
  field.addEventListener(field.type === 'checkbox' ? 'change' : 'input', () => {
    clearTimeout(saveTimer);
    if (field.type === 'checkbox') syncUI();
    saveTimer = setTimeout(saveSettings, field.type === 'checkbox' ? 0 : 300);
    refreshStatuses();
  });
});
