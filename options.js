const { DEFAULTS, FIELDS, SECTIONS, parseDnrEntries } = globalThis.CA_ENHANCED_SETTINGS;

const $root = $('#settings');
const $saved = $('#saved');
const $fields = {};
const $status = {};
const SECTION_KEY = 'caEnhancedActiveSection';
let activeSection = localStorage.getItem(SECTION_KEY) || SECTIONS[0]?.key || '';
let saveTimer = 0;
let savedTimer = 0;

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const renderStatus = field => field.status ? ` <span class="status" id="${field.key}Status" hidden>!</span>` : '';

function renderControl(field) {
  const attrs = [`id="${field.key}"`, field.title ? `title="${escapeHtml(field.title)}"` : ''];
  if (field.dependsOn) attrs.push(`data-depends-on="${field.dependsOn}"`);
  if (field.type === 'textarea') return `<textarea ${attrs.join(' ')} placeholder="${escapeHtml(field.placeholder || '')}"></textarea>`;
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
  const meta = field.key === 'dnrList'
    ? `<div class="meta-row"><span id="dnrCount">0 entries</span><span>${escapeHtml(field.note || '')}</span></div>`
    : field.note ? `<div class="field-note">${escapeHtml(field.note)}</div>` : '';
  return `<div class="field-shell field-shell--${field.type}">
    <label class="label" for="${field.key}">${escapeHtml(field.label)}${renderStatus(field)}</label>
    ${renderControl(field)}
    ${meta}
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
    chrome.runtime.sendMessage({ action: 'fillActiveGuestProfile' }, () => {
      if (chrome.runtime.lastError) return console.error('[CA Enhanced] Guest profile fill failed:', chrome.runtime.lastError);
      $saved.text('Sent').addClass('show');
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => $saved.removeClass('show').text('Saved'), 1000);
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
  $('#dnrCount').text(`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`);
  setStatus('dnrList', entries.length && validEntries.length !== entries.length ? 'Some lines need both first and last names.' : '');
  try {
    new RegExp($fields.backLinkText.val() || DEFAULTS.backLinkText, 'i');
    setStatus('backLinkText', '');
  } catch (error) {
    setStatus('backLinkText', 'Invalid regular expression.');
  }
}

function syncUI() {
  $('.tab').each((_, tab) => $(tab).toggleClass('active', tab.dataset.section === activeSection));
  $('[data-section-panel]').each((_, panel) => $(panel).prop('hidden', panel.dataset.sectionPanel !== activeSection));
  $('#fillGuestProfile').prop('disabled', !$fields.enableTestData.prop('checked'));
  FIELDS.forEach(field => {
    if (field.dependsOn) $fields[field.key].prop('disabled', !$fields[field.dependsOn].prop('checked'));
  });
  refreshStatus();
}

function readForm() {
  return Object.fromEntries(FIELDS.map(field => [field.key, field.type === 'toggle' ? $fields[field.key].prop('checked') : $fields[field.key].val()]));
}

function saveSettings() {
  chrome.storage.sync.set(readForm(), () => {
    if (chrome.runtime.lastError) return console.error('[CA Enhanced] Save failed:', chrome.runtime.lastError);
    syncUI();
    clearTimeout(savedTimer);
    $saved.addClass('show');
    savedTimer = setTimeout(() => $saved.removeClass('show'), 1000);
  });
}

function bindField(field) {
  const isImmediate = field.type === 'toggle' || field.type === 'color';
  $fields[field.key].on(isImmediate ? 'change' : 'input', () => {
    if (field.type === 'toggle') syncUI();
    else refreshStatus();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveSettings, isImmediate ? 0 : 180);
  });
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, items => {
    if (chrome.runtime.lastError) return console.error('[CA Enhanced] Failed to load settings:', chrome.runtime.lastError);
    FIELDS.forEach(field => {
      if (field.type === 'toggle') $fields[field.key].prop('checked', !!items[field.key]);
      else $fields[field.key].val(items[field.key] == null ? field.defaultValue || '' : items[field.key]);
    });
    syncUI();
  });
}

mountForm();
FIELDS.forEach(bindField);
loadSettings();
