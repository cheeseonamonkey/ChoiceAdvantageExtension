(function() {
  'use strict';

  const SECTIONS = [
    { key: 'core', title: 'Core', note: 'DNR, Escape back, and explicit test data.', open: true },
    { key: 'macroRecorder', title: 'Macro Recorder', note: 'Record, inspect, export, and replay active-page UI steps.' }
  ];
  const FIELDS = [
    { key: 'enableDNR', section: 'core', type: 'toggle', label: 'DNR highlighting', description: 'Underline matching names and show the hover reminder.', title: 'Underline and mark flagged guest names in tables.', defaultValue: true },
    { key: 'dnrList', section: 'core', type: 'textarea', label: 'DNR list', title: 'One guest per line. Use LAST, FIRST or FIRST LAST.', placeholder: 'Smith, John\nDoe, Jane', defaultValue: '', dependsOn: 'enableDNR', status: true, note: 'One guest per line. Use LAST, FIRST or FIRST LAST.' },
    { key: 'dnrTooltipText', section: 'core', type: 'text', label: 'Hover text', description: 'Text shown in the DNR hover reminder.', title: 'Text shown in the hover reminder for flagged DNR names.', defaultValue: 'Check DNR!', dependsOn: 'enableDNR' },
    { key: 'dnrHighlightColor', section: 'core', type: 'color', label: 'Underline color', description: 'Underline color for flagged DNR names.', title: 'Underline color for flagged DNR names.', defaultValue: '#dc3545', dependsOn: 'enableDNR' },
    { key: 'enableEscapeKey', section: 'core', type: 'toggle', label: 'Escape key back', description: 'Press Escape to activate the page Back link.', title: 'Press Escape to click a visible Back link outside editable fields.', defaultValue: true },
    { key: 'backLinkText', section: 'core', type: 'text', label: 'Back link text', description: 'Exact text the Escape handler clicks.', title: 'Exact visible link text Escape clicks.', defaultValue: 'Back', dependsOn: 'enableEscapeKey' },
    { key: 'enableTestData', section: 'core', type: 'toggle', label: 'Test-data context menu', description: 'Show explicit test-data inserts on editable fields.', title: 'Right-click editable fields to insert fake names and fixed payment test values.', defaultValue: true }
  ];
  const DEFAULTS = Object.fromEntries(FIELDS.map(field => [field.key, field.defaultValue]));

  const cleanText = value => String(value || '').trim();
  const parseDnrEntries = value => String(value || '').split('\n').map(line => line.trim()).filter(Boolean);

  globalThis.CA_ENHANCED_SETTINGS = {
    DEFAULTS,
    FIELDS,
    SECTIONS,
    cleanText,
    parseDnrEntries
  };
})();
