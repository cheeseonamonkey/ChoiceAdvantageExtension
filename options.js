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
  hideRowMenuText: document.getElementById('hideRowMenuText')
};
const saved = document.getElementById('saved');
let saveTimer = 0;
let savedTimer = 0;

function showSaved() {
  if (!saved) return;
  clearTimeout(savedTimer);
  saved.classList.add('show');
  savedTimer = setTimeout(() => saved.classList.remove('show'), 1000);
}

function syncUI() {
  if (fields.abortRequestTimeoutMs) fields.abortRequestTimeoutMs.disabled = !fields.enableAbortRequests.checked;
  if (fields.abortRequestPatterns) fields.abortRequestPatterns.disabled = !fields.enableAbortRequests.checked;
  if (fields.dnrList && fields.enableDNR) fields.dnrList.disabled = !fields.enableDNR.checked;
  if (fields.dnrTooltipText) fields.dnrTooltipText.disabled = !fields.enableDNR.checked;
  if (fields.dnrHighlightColor) fields.dnrHighlightColor.disabled = !fields.enableDNR.checked;
  if (fields.hideColumnMenuText) fields.hideColumnMenuText.disabled = !fields.enableHideColumn.checked;
  if (fields.hideRowMenuText) fields.hideRowMenuText.disabled = !fields.enableHideRow.checked;
  if (fields.rememberedUsername) fields.rememberedUsername.disabled = !fields.enableRememberUsername.checked;
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
  });
});
