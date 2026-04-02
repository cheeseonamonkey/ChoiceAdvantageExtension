const DEFAULTS = {
  dnrList: '',
  enableBlockPendo: true,
  enableBlockTelemetry: false,
  enableBlockAkamai: false,
  blockedHosts: '',
  fixMixedContentFavicon: true,
  suppressWelcomeImage404: true,
  dedupeErrorMessageWriter: true,
  guardHideGooglePopup: true,
  removeUnusedFontPreload: true,
  removeTelemetryHints: true,
  lazyLoadNoncriticalImages: false,
  hideNoncriticalImages: false,
  hideTopBar: true,
  hideResourceCenter: true,
  fontMode: 'default',
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

const $fields = {
  dnrList: $('#dnrList'),
  enableBlockPendo: $('#enableBlockPendo'),
  enableBlockTelemetry: $('#enableBlockTelemetry'),
  enableBlockAkamai: $('#enableBlockAkamai'),
  blockedHosts: $('#blockedHosts'),
  fixMixedContentFavicon: $('#fixMixedContentFavicon'),
  suppressWelcomeImage404: $('#suppressWelcomeImage404'),
  dedupeErrorMessageWriter: $('#dedupeErrorMessageWriter'),
  guardHideGooglePopup: $('#guardHideGooglePopup'),
  removeUnusedFontPreload: $('#removeUnusedFontPreload'),
  removeTelemetryHints: $('#removeTelemetryHints'),
  lazyLoadNoncriticalImages: $('#lazyLoadNoncriticalImages'),
  hideNoncriticalImages: $('#hideNoncriticalImages'),
  hideTopBar: $('#hideTopBar'),
  hideResourceCenter: $('#hideResourceCenter'),
  fontMode: $('#fontMode'),
  animationMode: $('#animationMode'),
  enableNavPrefetch: $('#enableNavPrefetch'),
  navPrefetchLabels: $('#navPrefetchLabels'),
  enableAbortRequests: $('#enableAbortRequests'),
  abortRequestTimeoutMs: $('#abortRequestTimeoutMs'),
  abortRequestPatterns: $('#abortRequestPatterns'),
  enableCacheControl: $('#enableCacheControl'),
  cacheControlMaxAgeSeconds: $('#cacheControlMaxAgeSeconds'),
  cacheControlPatterns: $('#cacheControlPatterns'),
  enableDNR: $('#enableDNR'),
  enableEscapeKey: $('#enableEscapeKey'),
  enableHideColumn: $('#enableHideColumn'),
  enableHideRow: $('#enableHideRow'),
  enableRememberUsername: $('#enableRememberUsername'),
  rememberedUsernames: $('#rememberedUsernames'),
  dnrTooltipText: $('#dnrTooltipText'),
  dnrHighlightColor: $('#dnrHighlightColor'),
  backLinkText: $('#backLinkText'),
  hideColumnMenuText: $('#hideColumnMenuText'),
  hideRowMenuText: $('#hideRowMenuText')
};

const $ui = {
  saved: $('#saved'),
  dnrCount: $('#dnrCount'),
  rememberedCount: $('#rememberedCount'),
  navPrefetchCount: $('#navPrefetchCount'),
  navPrefetchMatches: $('#navPrefetchMatches')
};

const $tabs = $('[data-tab-button]');
const $panels = $('[data-tab-panel]');
const statusFields = {
  enableAbortRequests: $('#enableAbortRequestsStatus'),
  enableCacheControl: $('#enableCacheControlStatus'),
  enableNavPrefetch: $('#enableNavPrefetchStatus'),
  blockedHosts: $('#blockedHostsStatus'),
  abortRequestTimeoutMs: $('#abortRequestTimeoutMsStatus'),
  abortRequestPatterns: $('#abortRequestPatternsStatus'),
  cacheControlMaxAgeSeconds: $('#cacheControlMaxAgeSecondsStatus'),
  cacheControlPatterns: $('#cacheControlPatternsStatus'),
  navPrefetchLabels: $('#navPrefetchLabelsStatus'),
  dnrList: $('#dnrListStatus')
};

const RESERVED_HOSTS = new Set(['choiceadvantage.com', 'remoteaccess.choiceadvantage.com', 'content.nps.skytouchnps.com', 's.go-mpulse.net', 's2.go-mpulse.net', 'p11.techlab-cdn.com']);
const MAX_CUSTOM_HOSTS = 50;
const MAX_REMEMBERED_USERNAMES = 20;
let saveTimer = 0;
let savedTimer = 0;
let previewTimer = 0;
let activeTab = 'main';

const setText = ($node, value) => $node && $node.length && $node.text(value);
const splitLoose = value => String(value || '').split('\n').flatMap(line => line.split(',')).map(part => part.replace(/#.*/, '').trim()).filter(Boolean);
const splitLines = value => String(value || '').split('\n').map(line => line.replace(/#.*/, '').trim()).filter(Boolean);
const normalizeHost = host => String(host || '').trim().replace(/#.*/, '').replace(/[,\s]+$/, '').toLowerCase().replace(/^\*\./, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

function parseRememberedUsernames(value) {
  const seen = new Set();
  return splitLines(value).filter(username => {
    const key = username.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_REMEMBERED_USERNAMES);
}

const getPrimaryRememberedUsername = value => parseRememberedUsernames(value)[0] || '';

function setStatus(field, message) {
  const $status = statusFields[field];
  if (!$status || !$status.length) return;
  $status.prop('hidden', !message).toggleClass('show', !!message).attr('title', message || '');
}

function setCount($node, count, singular, plural = `${singular}s`) {
  setText($node, `${count} ${count === 1 ? singular : plural}`);
}

function renderNavPrefetchPreview(message) {
  setText($ui.navPrefetchMatches, message);
}

function updateNavPrefetchPreview() {
  if (activeTab !== 'network') return;
  const labels = splitLoose($fields.navPrefetchLabels.val()).filter(value => value.length >= 3);
  setCount($ui.navPrefetchCount, labels.length, 'label');
  if (!$fields.enableNavPrefetch.prop('checked')) return renderNavPrefetchPreview('Enable nav prefetch to preview matches.');
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
  clearTimeout(previewTimer);
  if (activeTab !== 'network') return;
  previewTimer = setTimeout(updateNavPrefetchPreview, 40);
}

function refreshStatuses() {
  const blocked = splitLoose($fields.blockedHosts.val());
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

  const timeout = Number($fields.abortRequestTimeoutMs.val());
  setStatus('abortRequestTimeoutMs', !Number.isInteger(timeout) || timeout < 1 ? 'Must be a positive whole number.' : '');

  const abortPatterns = splitLoose($fields.abortRequestPatterns.val());
  const validAbortPatterns = abortPatterns.filter(part => part.length >= 3);
  setStatus('abortRequestPatterns', abortPatterns.length && validAbortPatterns.length !== abortPatterns.length ? 'Entries shorter than 3 characters are ignored.' : '');

  const cacheMaxAge = Number($fields.cacheControlMaxAgeSeconds.val());
  setStatus('cacheControlMaxAgeSeconds', !Number.isInteger(cacheMaxAge) || cacheMaxAge < 1 ? 'Must be a positive whole number.' : '');

  const cachePatterns = splitLoose($fields.cacheControlPatterns.val());
  const validCachePatterns = cachePatterns.filter(part => part.length >= 3);
  setStatus('cacheControlPatterns', cachePatterns.length && validCachePatterns.length !== cachePatterns.length ? 'Entries shorter than 3 characters are ignored.' : '');

  const navLabels = splitLoose($fields.navPrefetchLabels.val());
  const validNavLabels = navLabels.filter(part => part.length >= 3);
  setStatus('navPrefetchLabels', navLabels.length && validNavLabels.length !== navLabels.length ? 'Entries shorter than 3 characters are ignored.' : '');

  const dnrLines = String($fields.dnrList.val() || '').split('\n').map(line => line.trim()).filter(Boolean);
  const validDnrLines = dnrLines.filter(line => line.replace(/,/g, ' ').split(/\s+/).filter(Boolean).length >= 2);
  setCount($ui.dnrCount, dnrLines.length, 'entry', 'entries');
  setStatus('dnrList', dnrLines.length && validDnrLines.length !== dnrLines.length ? 'Some lines need both first and last names.' : '');

  const rememberedCount = parseRememberedUsernames($fields.rememberedUsernames.val()).length;
  setText($ui.rememberedCount, `${rememberedCount} saved${rememberedCount >= MAX_REMEMBERED_USERNAMES ? ` · max ${MAX_REMEMBERED_USERNAMES}` : ''}`);

  setStatus('enableAbortRequests',
    $fields.enableAbortRequests.prop('checked')
      ? (!validAbortPatterns.length ? 'Add at least one URL pattern.' : '')
      : (abortPatterns.length ? 'Disabled, so listed patterns will not apply.' : '')
  );
  setStatus('enableNavPrefetch',
    $fields.enableNavPrefetch.prop('checked')
      ? (!validNavLabels.length ? 'Add at least one label.' : '')
      : (validNavLabels.length ? 'Disabled, so matching links will not prefetch.' : '')
  );
  setStatus('enableCacheControl',
    $fields.enableCacheControl.prop('checked')
      ? (!validCachePatterns.length ? 'Add at least one URL pattern.' : '')
      : (validCachePatterns.length ? 'Disabled, so matching requests will not get cache hints.' : '')
  );

  scheduleNavPrefetchPreview();
}

function syncUI() {
  $fields.navPrefetchLabels.prop('disabled', !$fields.enableNavPrefetch.prop('checked'));
  $fields.abortRequestTimeoutMs.prop('disabled', !$fields.enableAbortRequests.prop('checked'));
  $fields.abortRequestPatterns.prop('disabled', !$fields.enableAbortRequests.prop('checked'));
  $fields.cacheControlMaxAgeSeconds.prop('disabled', !$fields.enableCacheControl.prop('checked'));
  $fields.cacheControlPatterns.prop('disabled', !$fields.enableCacheControl.prop('checked'));
  $fields.dnrList.prop('disabled', !$fields.enableDNR.prop('checked'));
  $fields.dnrTooltipText.prop('disabled', !$fields.enableDNR.prop('checked'));
  $fields.dnrHighlightColor.prop('disabled', !$fields.enableDNR.prop('checked'));
  $fields.hideColumnMenuText.prop('disabled', !$fields.enableHideColumn.prop('checked'));
  $fields.hideRowMenuText.prop('disabled', !$fields.enableHideRow.prop('checked'));
  $fields.rememberedUsernames.prop('disabled', !$fields.enableRememberUsername.prop('checked'));
  refreshStatuses();
}

function setActiveTab(name) {
  activeTab = name;
  clearTimeout(previewTimer);
  $tabs.each((_, button) => {
    const $button = $(button);
    const active = $button.data('tab-button') === name;
    $button.toggleClass('is-active', active).attr('aria-selected', active ? 'true' : 'false').prop('tabIndex', active ? 0 : -1);
  });
  $panels.each((_, panel) => $(panel).prop('hidden', $(panel).data('tab-panel') !== name).attr('aria-hidden', $(panel).data('tab-panel') !== name));
  if (name === 'network') scheduleNavPrefetchPreview();
}

function showSaved() {
  clearTimeout(savedTimer);
  $ui.saved.addClass('show');
  savedTimer = setTimeout(() => $ui.saved.removeClass('show'), 1000);
}

function scheduleSave(delay) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, delay);
}

function readForm() {
  const rememberedUsernames = parseRememberedUsernames($fields.rememberedUsernames.val() || '').join('\n');
  return {
    dnrList: $fields.dnrList.val() || '',
    enableBlockPendo: $fields.enableBlockPendo.prop('checked'),
    enableBlockTelemetry: $fields.enableBlockTelemetry.prop('checked'),
    enableBlockAkamai: $fields.enableBlockAkamai.prop('checked'),
    blockedHosts: $fields.blockedHosts.val() || '',
    fixMixedContentFavicon: $fields.fixMixedContentFavicon.prop('checked'),
    suppressWelcomeImage404: $fields.suppressWelcomeImage404.prop('checked'),
    dedupeErrorMessageWriter: $fields.dedupeErrorMessageWriter.prop('checked'),
    guardHideGooglePopup: $fields.guardHideGooglePopup.prop('checked'),
    removeUnusedFontPreload: $fields.removeUnusedFontPreload.prop('checked'),
    removeTelemetryHints: $fields.removeTelemetryHints.prop('checked'),
    lazyLoadNoncriticalImages: $fields.lazyLoadNoncriticalImages.prop('checked'),
    hideNoncriticalImages: $fields.hideNoncriticalImages.prop('checked'),
    hideTopBar: $fields.hideTopBar.prop('checked'),
    hideResourceCenter: $fields.hideResourceCenter.prop('checked'),
    fontMode: $fields.fontMode.val() || DEFAULTS.fontMode,
    animationMode: $fields.animationMode.val() || DEFAULTS.animationMode,
    enableNavPrefetch: $fields.enableNavPrefetch.prop('checked'),
    navPrefetchLabels: $fields.navPrefetchLabels.val() || '',
    enableAbortRequests: $fields.enableAbortRequests.prop('checked'),
    abortRequestTimeoutMs: Math.max(1, parseInt($fields.abortRequestTimeoutMs.val() || DEFAULTS.abortRequestTimeoutMs, 10) || DEFAULTS.abortRequestTimeoutMs),
    abortRequestPatterns: $fields.abortRequestPatterns.val() || '',
    enableCacheControl: $fields.enableCacheControl.prop('checked'),
    cacheControlMaxAgeSeconds: Math.max(1, parseInt($fields.cacheControlMaxAgeSeconds.val() || DEFAULTS.cacheControlMaxAgeSeconds, 10) || DEFAULTS.cacheControlMaxAgeSeconds),
    cacheControlPatterns: $fields.cacheControlPatterns.val() || '',
    enableDNR: $fields.enableDNR.prop('checked'),
    enableEscapeKey: $fields.enableEscapeKey.prop('checked'),
    enableHideColumn: $fields.enableHideColumn.prop('checked'),
    enableHideRow: $fields.enableHideRow.prop('checked'),
    enableRememberUsername: $fields.enableRememberUsername.prop('checked'),
    rememberedUsernames,
    rememberedUsername: getPrimaryRememberedUsername(rememberedUsernames),
    dnrTooltipText: $fields.dnrTooltipText.val() || DEFAULTS.dnrTooltipText,
    dnrHighlightColor: $fields.dnrHighlightColor.val() || DEFAULTS.dnrHighlightColor,
    backLinkText: $fields.backLinkText.val() || DEFAULTS.backLinkText,
    hideColumnMenuText: $fields.hideColumnMenuText.val() || DEFAULTS.hideColumnMenuText,
    hideRowMenuText: $fields.hideRowMenuText.val() || DEFAULTS.hideRowMenuText
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

function bindField(field) {
  const isImmediate = field.is('input[type="checkbox"], select');
  const eventName = isImmediate ? 'change' : 'input';
  field.on(eventName, () => {
    if (field.is('input[type="checkbox"]')) syncUI();
    else refreshStatuses();
    scheduleSave(isImmediate ? 0 : 250);
  });
}

chrome.storage.sync.get(DEFAULTS, items => {
  if (chrome.runtime.lastError) {
    console.error('[CA Enhanced] Failed to load settings:', chrome.runtime.lastError);
    return;
  }
  const values = { ...DEFAULTS, ...items, rememberedUsernames: items.rememberedUsernames || items.rememberedUsername || '' };
  try {
    Object.entries($fields).forEach(([key, $field]) => {
      if (!$field.length) return;
      if ($field.is(':checkbox')) $field.prop('checked', !!values[key]);
      else $field.val(values[key] || '');
    });
    setActiveTab('main');
    syncUI();
  } catch (e) {
    console.error('[CA Enhanced] Failed to load settings:', e);
  }
});

$tabs.on('click', function() {
  setActiveTab($(this).data('tab-button'));
});

$tabs.on('keydown', function(e) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const index = $tabs.index(this);
  const nextIndex = e.key === 'Home' ? 0 : e.key === 'End' ? $tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + $tabs.length) % $tabs.length;
  const $next = $tabs.eq(nextIndex);
  setActiveTab($next.data('tab-button'));
  $next.trigger('focus');
});

Object.values($fields).forEach(bindField);
