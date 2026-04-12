const {
  DEFAULTS,
  FIELDS,
  SECTIONS,
  RESERVED_HOSTS,
  MAX_CUSTOM_HOSTS,
  MAX_REMEMBERED_USERNAMES,
  splitLoose,
  normalizeHost,
  parseRememberedUsernames,
  getPrimaryRememberedUsername,
  parseDnrEntries
} = globalThis.CA_ENHANCED_SETTINGS;

const $root = $('#settings');
const $saved = $('#saved');
const $fields = {};
const $status = {};
const $ui = {};
let saveTimer = 0;
let savedTimer = 0;
let previewTimer = 0;

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const setText = ($node, value) => $node && $node.length && $node.text(value);
const setCount = ($node, count, singular, plural = `${singular}s`) => setText($node, `${count} ${count === 1 ? singular : plural}`);
const renderStatus = field => field.status ? ` <span class="status" id="${field.key}Status" hidden>!</span>` : '';
const renderHint = field => field.note ? `<div class="field-note">${escapeHtml(field.note)}</div>` : '';

function renderControl(field) {
  const attrs = [`id="${field.key}"`, field.title ? `title="${escapeHtml(field.title)}"` : ''];
  if (field.dependsOn) attrs.push(`data-depends-on="${field.dependsOn}"`);
  if (field.type === 'textarea') return `<textarea ${attrs.join(' ')} placeholder="${escapeHtml(field.placeholder || '')}"></textarea>`;
  if (field.type === 'select') return `<select ${attrs.join(' ')}>${field.options.map(option => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('')}</select>`;
  if (field.type === 'number') return `<input ${attrs.join(' ')} type="number" min="${field.min || 1}" step="${field.step || 1}">`;
  if (field.type === 'color') return `<input ${attrs.join(' ')} type="color">`;
  return `<input ${attrs.join(' ')} type="text" placeholder="${escapeHtml(field.placeholder || '')}">`;
}

function renderField(field) {
  if (field.type === 'toggle') {
    return `<label class="toggle" title="${escapeHtml(field.title || '')}">
      <input type="checkbox" id="${field.key}">
      <div>
        <strong>${escapeHtml(field.label)}${renderStatus(field)}</strong>
        <span>${escapeHtml(field.description || '')}</span>
      </div>
    </label>`;
  }
  const counts = field.key === 'dnrList'
    ? `<div class="meta-row"><span id="dnrCount">0 entries</span><span>${escapeHtml(field.note || '')}</span></div>`
    : field.key === 'rememberedUsernames'
      ? `<div class="meta-row"><span id="rememberedCount">0 saved</span><span>${escapeHtml(field.note || '')}</span></div>`
      : field.key === 'navPrefetchLabels'
        ? `<div class="meta-row"><span id="navPrefetchCount">0 labels</span><span id="navPrefetchMatches">Open a ChoiceADVANTAGE page to preview matches.</span></div>`
        : '';
  return `<div class="field-shell field-shell--${field.type}">
    <label class="label" for="${field.key}">${escapeHtml(field.label)}${renderStatus(field)}</label>
    ${renderControl(field)}
    ${counts || renderHint(field)}
  </div>`;
}

function renderSection(section) {
  const fields = FIELDS.filter(field => field.section === section.key);
  return `<details class="group" ${section.open ? 'open' : ''}>
    <summary>
      <span>${escapeHtml(section.title)}</span>
      <span class="group-note">${escapeHtml(section.note || '')}</span>
    </summary>
    <div class="group-body">
      ${fields.map(renderField).join('')}
    </div>
  </details>`;
}

function mountForm() {
  $root.html(SECTIONS.map(renderSection).join(''));
  FIELDS.forEach(field => { $fields[field.key] = $(`#${field.key}`); });
  FIELDS.filter(field => field.status).forEach(field => { $status[field.key] = $(`#${field.key}Status`); });
  $ui.dnrCount = $('#dnrCount');
  $ui.rememberedCount = $('#rememberedCount');
  $ui.navPrefetchCount = $('#navPrefetchCount');
  $ui.navPrefetchMatches = $('#navPrefetchMatches');
}

function setStatus(key, message) {
  const $node = $status[key];
  if (!$node || !$node.length) return;
  $node.prop('hidden', !message).toggleClass('show', !!message).attr('title', message || '');
}

function renderNavPrefetchPreview(message) {
  setText($ui.navPrefetchMatches, message);
}

function updateNavPrefetchPreview() {
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
  previewTimer = setTimeout(updateNavPrefetchPreview, 60);
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

  const dnrEntries = parseDnrEntries($fields.dnrList.val());
  const validDnrEntries = dnrEntries.filter(line => line.replace(/,/g, ' ').split(/\s+/).filter(Boolean).length >= 2);
  setCount($ui.dnrCount, dnrEntries.length, 'entry', 'entries');
  setStatus('dnrList', dnrEntries.length && validDnrEntries.length !== dnrEntries.length ? 'Some lines need both first and last names.' : '');

  const rememberedCount = parseRememberedUsernames($fields.rememberedUsernames.val()).length;
  setText($ui.rememberedCount, `${rememberedCount} saved${rememberedCount >= MAX_REMEMBERED_USERNAMES ? ` · max ${MAX_REMEMBERED_USERNAMES}` : ''}`);

  setStatus('enableAbortRequests', $fields.enableAbortRequests.prop('checked') ? (!validAbortPatterns.length ? 'Add at least one URL pattern.' : '') : (abortPatterns.length ? 'Disabled, so listed patterns will not apply.' : ''));
  setStatus('enableCacheControl', $fields.enableCacheControl.prop('checked') ? (!validCachePatterns.length ? 'Add at least one URL pattern.' : '') : (validCachePatterns.length ? 'Disabled, so matching requests will not get cache hints.' : ''));
  setStatus('enableNavPrefetch', $fields.enableNavPrefetch.prop('checked') ? (!validNavLabels.length ? 'Add at least one label.' : '') : (validNavLabels.length ? 'Disabled, so matching links will not prefetch.' : ''));

  scheduleNavPrefetchPreview();
}

function syncUI() {
  FIELDS.forEach(field => {
    if (!field.dependsOn) return;
    const parent = $fields[field.dependsOn];
    if (!parent || !$fields[field.key]) return;
    $fields[field.key].prop('disabled', !parent.prop('checked'));
  });
  refreshStatuses();
}

function readForm() {
  const values = {};
  FIELDS.forEach(field => {
    const $field = $fields[field.key];
    if (!$field || !$field.length) return;
    if (field.type === 'toggle') values[field.key] = $field.prop('checked');
    else if (field.type === 'number') values[field.key] = Math.max(field.min || 1, parseInt($field.val() || field.defaultValue, 10) || field.defaultValue);
    else values[field.key] = $field.val() || field.defaultValue || '';
  });
  const rememberedUsernames = parseRememberedUsernames(values.rememberedUsernames || '').join('\n');
  values.rememberedUsernames = rememberedUsernames;
  values.rememberedUsername = getPrimaryRememberedUsername(rememberedUsernames);
  return values;
}

function showSaved() {
  clearTimeout(savedTimer);
  $saved.addClass('show');
  savedTimer = setTimeout(() => $saved.removeClass('show'), 1000);
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

function scheduleSave(delay) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, delay);
}

function bindField(field) {
  const $field = $fields[field.key];
  if (!$field || !$field.length) return;
  const isImmediate = field.type === 'toggle' || field.type === 'select' || field.type === 'color';
  $field.on(isImmediate ? 'change' : 'input', () => {
    if (field.type === 'toggle') syncUI();
    else refreshStatuses();
    scheduleSave(isImmediate ? 0 : 180);
  });
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, items => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Failed to load settings:', chrome.runtime.lastError);
      return;
    }
    const values = { ...DEFAULTS, ...items, rememberedUsernames: items.rememberedUsernames || items.rememberedUsername || '' };
    try {
      FIELDS.forEach(field => {
        const $field = $fields[field.key];
        if (!$field || !$field.length) return;
        if (field.type === 'toggle') $field.prop('checked', !!values[field.key]);
        else $field.val(values[field.key] == null ? field.defaultValue || '' : values[field.key]);
      });
      syncUI();
    } catch (error) {
      console.error('[CA Enhanced] Failed to load settings:', error);
    }
  });
}

mountForm();
FIELDS.forEach(bindField);
loadSettings();
