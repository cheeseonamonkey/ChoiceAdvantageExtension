const { DEFAULTS, FIELDS, SECTIONS, parseDnrEntries } = globalThis.CA_ENHANCED_SETTINGS;

const $root = $('#settings');
const $saved = $('#saved');
const $fields = {};
const $status = {};
const SECTION_KEY = 'caEnhancedActiveSection';
const COUNTED_FIELDS = FIELDS.filter(field => field.type === 'textarea');
const savedSection = localStorage.getItem(SECTION_KEY);
let activeSection = SECTIONS.some(section => section.key === savedSection) ? savedSection : SECTIONS[0]?.key || '';
let saveTimer = 0;
let savedTimer = 0;
let pendingSaves = {};
let activeSave = Promise.resolve(true);
let fillInProgress = false;

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const renderStatus = field => field.status ? ` <span class="status" id="${field.key}Status" hidden>!</span>` : '';
const pluralize = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const countLabel = field => field.key === 'dnrList' ? ['entry', 'entries'] : ['line'];
const countLines = field => String($fields[field.key]?.val() || '').split('\n').map(line => line.trim()).filter(Boolean).length;
const hasPendingSaves = () => Object.keys(pendingSaves).length > 0;
const syncBytes = value => new TextEncoder().encode(String(value || '')).length;

function renderControl(field) {
  const attrs = [`id="${field.key}"`, field.title ? `title="${escapeHtml(field.title)}"` : ''];
  if (field.dependsOn) attrs.push(`data-depends-on="${field.dependsOn}"`);
  if (field.type === 'textarea') return `<textarea ${attrs.join(' ')} placeholder="${escapeHtml(field.placeholder || '')}"></textarea>`;
  if (field.type === 'color') return `<input ${attrs.join(' ')} type="color">`;
  return `<input ${attrs.join(' ')} type="text" placeholder="${escapeHtml(field.placeholder || '')}">`;
}

function renderMeta(field) {
  const note = escapeHtml(field.note || field.description || '');
  if (!COUNTED_FIELDS.includes(field)) return note ? `<div class="field-note">${note}</div>` : '';
  return `<div class="meta-row">
    <span id="${field.key}Count">${pluralize(0, ...countLabel(field))}</span>
    <span>${note}</span>
  </div>`;
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
  return `<div class="field-shell field-shell--${field.type}">
    <label class="label" for="${field.key}">${escapeHtml(field.label)}${renderStatus(field)}</label>
    ${renderControl(field)}
    ${renderMeta(field)}
  </div>`;
}

const renderAdvanced = (title, fields) => `<details class="advanced">
  <summary>${escapeHtml(title)}</summary>
  <div class="advanced-body">${fields.map(renderField).join('')}</div>
</details>`;

function renderSectionFields(section) {
  const fields = FIELDS.filter(field => field.section === section.key);
  if (section.key !== 'guestProfile') return fields.map(renderField).join('');
  return `<button type="button" class="action-button" id="fillGuestProfile">Fill current page</button>
    ${renderAdvanced('Advanced generated values', fields.filter(field => field.group === 'guestValues'))}
    ${renderAdvanced('Advanced selectors', fields.filter(field => field.group === 'guestSelectors'))}`;
}

function mountForm() {
  $root.html(`<div class="tabs">${SECTIONS.map(section => `<button type="button" class="tab" data-section="${section.key}">${escapeHtml(section.title)}</button>`).join('')}</div>
    ${SECTIONS.map(section => `<section class="group" data-section-panel="${section.key}">
      <div class="group-head"><strong>${escapeHtml(section.title)}</strong><span>${escapeHtml(section.note || '')}</span></div>
      <div class="group-body">${renderSectionFields(section)}</div>
    </section>`).join('')}`);
  FIELDS.forEach(field => { $fields[field.key] = $(`#${field.key}`); });
  FIELDS.filter(field => field.status).forEach(field => { $status[field.key] = $(`#${field.key}Status`); });
  $root.on('click', '.tab', event => {
    activeSection = event.currentTarget.dataset.section;
    localStorage.setItem(SECTION_KEY, activeSection);
    syncUI();
  });
  $root.on('click', '#fillGuestProfile', () => {
    if (fillInProgress) return;
    fillInProgress = true;
    syncUI();
    showSaved(hasPendingSaves() ? 'Saving' : 'Filling', 'pending', 0);
    flushSaves().then(ok => {
      if (!ok) {
        fillInProgress = false;
        syncUI();
        return showSaved('Failed', 'failed', 0);
      }
      showSaved('Filling', 'pending', 0);
      chrome.runtime.sendMessage({ action: 'fillActiveGuestProfile' }, response => {
        fillInProgress = false;
        syncUI();
        if (chrome.runtime.lastError) {
          console.error('[CA Enhanced] Guest profile fill failed:', chrome.runtime.lastError);
          return showSaved('Failed', 'failed');
        }
        showSaved(response && response.ok ? 'Sent' : 'Failed', response && response.ok ? '' : 'failed');
      });
    });
  });
}

function setStatus(key, message) {
  const $node = $status[key];
  if ($node && $node.length) $node.prop('hidden', !message).toggleClass('show', !!message).attr('title', message || '');
}

function refreshStatus() {
  const entries = parseDnrEntries($fields.dnrList.val());
  const validEntries = entries.filter(line => line.replace(/,/g, ' ').split(/\s+/).filter(Boolean).length >= 2);
  COUNTED_FIELDS.forEach(field => $(`#${field.key}Count`).text(pluralize(countLines(field), ...countLabel(field))));
  setStatus('dnrList', entries.length && validEntries.length !== entries.length ? 'Some lines need both first and last names.' : '');
  setStatus('backLinkText', fieldError(FIELDS.find(field => field.key === 'backLinkText')));
}

function syncUI() {
  $('.tab').each((_, tab) => $(tab).toggleClass('active', tab.dataset.section === activeSection));
  $('[data-section-panel]').each((_, panel) => $(panel).prop('hidden', panel.dataset.sectionPanel !== activeSection));
  $('#fillGuestProfile').prop('disabled', fillInProgress || !$fields.enableTestData.prop('checked'));
  FIELDS.forEach(field => {
    if (field.dependsOn) $fields[field.key].prop('disabled', !$fields[field.dependsOn].prop('checked'));
  });
  refreshStatus();
}

const readField = field => field.type === 'toggle' ? $fields[field.key].prop('checked') : $fields[field.key].val();

function fieldError(field) {
  if (!field || field.key !== 'backLinkText') return '';
  if (syncBytes(readField(field)) > 8000) return 'Too large to sync.';
  try {
    new RegExp($fields.backLinkText.val() || DEFAULTS.backLinkText, 'i');
    return '';
  } catch (error) {
    return 'Invalid regular expression.';
  }
}

function saveBatch(values) {
  return new Promise(resolve => {
  chrome.storage.sync.set(values, () => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Save failed:', chrome.runtime.lastError);
      if (Object.keys(pendingSaves).length) saveTimer = setTimeout(flushSaves, 1000);
      return resolve(false);
    }
      resolve(true);
    });
  });
}

function flushSaves() {
  clearTimeout(saveTimer);
  const next = pendingSaves;
  pendingSaves = {};
  if (!Object.keys(next).length) return activeSave;
  activeSave = activeSave.then(async previousOk => {
    const ok = await saveBatch(next);
    if (!ok) {
      pendingSaves = { ...next, ...pendingSaves };
      showSaved('Failed', 'failed', 0);
      return false;
    }
    showSaved(hasPendingSaves() ? 'Pending' : 'Saved', hasPendingSaves() ? 'pending' : '', hasPendingSaves() ? 0 : 1000);
    return ok;
  });
  return activeSave;
}

function saveField(field, immediate) {
  const error = fieldError(field);
  if (!error && syncBytes(readField(field)) > 8000) return showSaved('Too large', 'failed', 0);
  if (error) {
    delete pendingSaves[field.key];
    if (!hasPendingSaves()) clearTimeout(saveTimer);
    return showSaved('Not saved', 'failed');
  }
  if (immediate) saveNow(field);
  else {
    pendingSaves[field.key] = readField(field);
    showSaved('Pending', 'pending', 0);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSaves, 250);
  }
}

function saveNow(field) {
  activeSave = activeSave.then(async () => {
    const ok = await saveBatch({ [field.key]: readField(field) });
    showSaved(ok ? (hasPendingSaves() ? 'Pending' : 'Saved') : 'Failed', ok && hasPendingSaves() ? 'pending' : ok ? '' : 'failed', ok && hasPendingSaves() ? 0 : ok ? 1000 : 0);
    return ok;
  });
}

function showSaved(text = 'Saved', state = '', timeout = 1000) {
  $saved.text(text).removeClass('pending failed').toggleClass('pending', state === 'pending').toggleClass('failed', state === 'failed').addClass('show');
  clearTimeout(savedTimer);
  if (timeout) savedTimer = setTimeout(() => $saved.removeClass('show pending failed').text('Saved'), timeout);
}

function bindField(field) {
  const isImmediate = field.type === 'toggle' || field.type === 'color';
  $fields[field.key].on(isImmediate ? 'change' : 'input', () => {
    if (field.type === 'toggle') syncUI();
    else refreshStatus();
    saveField(field, isImmediate);
  });
  if (!isImmediate) $fields[field.key].on('blur change', () => flushSaves());
}

function loadSettings(done) {
  chrome.storage.sync.get(DEFAULTS, items => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Failed to load settings:', chrome.runtime.lastError);
      items = DEFAULTS;
    }
    FIELDS.forEach(field => {
      if (field.type === 'toggle') $fields[field.key].prop('checked', !!items[field.key]);
      else $fields[field.key].val(items[field.key] == null ? field.defaultValue || '' : items[field.key]);
    });
    syncUI();
    if (done) done();
  });
}

mountForm();
loadSettings(() => FIELDS.forEach(bindField));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushSaves();
});
window.addEventListener('pagehide', () => { flushSaves(); });
