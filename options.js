const DEFAULTS = {
  dnrList: '',
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
  if (!fields.dnrList || !fields.enableDNR) return;
  fields.dnrList.disabled = !fields.enableDNR.checked;
  if (fields.dnrTooltipText) fields.dnrTooltipText.disabled = !fields.enableDNR.checked;
  if (fields.dnrHighlightColor) fields.dnrHighlightColor.disabled = !fields.enableDNR.checked;
  if (fields.hideColumnMenuText) fields.hideColumnMenuText.disabled = !fields.enableHideColumn.checked;
  if (fields.hideRowMenuText) fields.hideRowMenuText.disabled = !fields.enableHideRow.checked;
  if (fields.rememberedUsername) fields.rememberedUsername.disabled = !fields.enableRememberUsername.checked;
}

function readForm() {
  return {
    dnrList: fields.dnrList ? fields.dnrList.value || '' : '',
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
