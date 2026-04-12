(function() {
  'use strict';

  const SECTIONS = [
    { key: 'core', title: 'Core', note: 'Daily helpers that should stay predictable.', open: true },
    { key: 'tables', title: 'Tables', note: 'Context-menu tools and table labels.', open: true },
    { key: 'login', title: 'Login', note: 'Username memory only. Passwords are never stored.', open: true },
    { key: 'pageFixes', title: 'Page Fixes', note: 'Corrective fixes that are usually safe to leave on.', open: true },
    { key: 'styling', title: 'Styling', note: 'Cosmetic page changes. Disabled by default.', open: false },
    { key: 'blocking', title: 'Blocking', note: 'Network blocking and custom host rules.', open: false },
    { key: 'performance', title: 'Performance', note: 'Prefetch and image behavior.', open: false }
  ];

  const FIELDS = [
    { key: 'enableDNR', section: 'core', type: 'toggle', label: 'DNR highlighting', description: 'Underline matching names and show the hover reminder.', title: 'Underline and mark flagged guest names in tables.', defaultValue: true },
    { key: 'dnrList', section: 'core', type: 'textarea', label: 'DNR list', title: 'One guest per line. Use LAST, FIRST or FIRST LAST.', placeholder: 'Smith, John\nDoe, Jane', defaultValue: '', dependsOn: 'enableDNR', status: true, note: 'One guest per line. Use LAST, FIRST or FIRST LAST.' },
    { key: 'dnrTooltipText', section: 'core', type: 'text', label: 'Hover text', description: 'Text shown in the DNR hover reminder.', title: 'Text shown in the hover reminder for flagged DNR names.', defaultValue: 'Check DNR!', dependsOn: 'enableDNR' },
    { key: 'dnrHighlightColor', section: 'core', type: 'color', label: 'Underline color', description: 'Underline color for flagged DNR names.', title: 'Underline color for flagged DNR names.', defaultValue: '#dc3545', dependsOn: 'enableDNR' },
    { key: 'enableEscapeKey', section: 'core', type: 'toggle', label: 'Escape key back', description: 'Press Escape to activate the page Back link.', title: 'Press Escape to trigger the page Back link outside form fields.', defaultValue: true },
    { key: 'backLinkText', section: 'core', type: 'text', label: 'Back link text', description: 'Exact text the Escape handler clicks.', title: 'Exact text the Escape key handler clicks to go back.', defaultValue: 'Back', dependsOn: 'enableEscapeKey' },

    { key: 'enableHideColumn', section: 'tables', type: 'toggle', label: 'Hide column menu', description: 'Show the right-click Hide Column action.', title: 'Expose the context-menu action for hiding a clicked table column.', defaultValue: true },
    { key: 'hideColumnMenuText', section: 'tables', type: 'text', label: 'Hide column menu label', description: 'Context-menu label for hiding the clicked table column.', title: 'Context-menu label for hiding the clicked table column.', defaultValue: 'Hide Column', dependsOn: 'enableHideColumn' },
    { key: 'enableHideRow', section: 'tables', type: 'toggle', label: 'Hide row menu', description: 'Show the right-click Hide Row action.', title: 'Expose the context-menu action for hiding a clicked table row.', defaultValue: true },
    { key: 'hideRowMenuText', section: 'tables', type: 'text', label: 'Hide row menu label', description: 'Context-menu label for hiding the clicked row.', title: 'Context-menu label for hiding the clicked row.', defaultValue: 'Hide Row', dependsOn: 'enableHideRow' },

    { key: 'enableRememberUsername', section: 'login', type: 'toggle', label: 'Remember usernames', description: 'Keep multiple usernames and suggest them on login fields.', title: 'Save and autofill usernames only. Passwords are never stored.', defaultValue: true },
    { key: 'rememberedUsernames', section: 'login', type: 'textarea', label: 'Remembered usernames', placeholder: 'frontdesk@hotel.com\nnightaudit@hotel.com', defaultValue: '', dependsOn: 'enableRememberUsername', note: 'Newest is used first. Older ones stay available as suggestions.' },

    { key: 'fixMixedContentFavicon', section: 'pageFixes', type: 'toggle', label: 'Fix mixed favicon', description: 'Replace the broken insecure favicon URL.', title: 'Replace the insecure mixed-content favicon URL with a safe inline icon.', defaultValue: true },
    { key: 'suppressWelcomeImage404', section: 'pageFixes', type: 'toggle', label: 'Suppress welcome image 404', description: 'Hide the repeated broken welcome image request.', title: 'Hide the broken welcome image request that repeatedly 404s.', defaultValue: true },
    { key: 'dedupeErrorMessageWriter', section: 'pageFixes', type: 'toggle', label: 'Dedupe ErrorMessageWriter', description: 'Prevent duplicate script loads and redeclaration errors.', title: 'Prevent duplicate ErrorMessageWriter loads that trigger redeclaration errors.', defaultValue: false },
    { key: 'guardHideGooglePopup', section: 'pageFixes', type: 'toggle', label: 'Guard login popup handler', description: 'Prevent the broken login popup handler from throwing.', title: 'Wrap the broken hideGooglePopUp handler so null nodes do not throw.', defaultValue: false },
    { key: 'removeUnusedFontPreload', section: 'pageFixes', type: 'toggle', label: 'Remove stale font preload', description: 'Remove the unused Sansation preload warning.', title: 'Remove the unused Sansation font preload that causes warnings.', defaultValue: true },
    { key: 'removeTelemetryHints', section: 'pageFixes', type: 'toggle', label: 'Remove telemetry hints', description: 'Strip resource hints pointing at blocked telemetry hosts.', title: 'Strip resource hints pointing at blocked telemetry hosts.', defaultValue: false },

    { key: 'hideTopBar', section: 'styling', type: 'toggle', label: 'Hide top bar', description: 'Hide the CHI top bar.', title: 'Hide the CHI top bar to free up more room.', defaultValue: false },
    { key: 'hideResourceCenter', section: 'styling', type: 'toggle', label: 'Hide Resource Center', description: 'Hide the Resource Center launcher button.', title: 'Hide the Resource Center launcher button.', defaultValue: false },
    { key: 'fontMode', section: 'styling', type: 'select', label: 'Font mode', description: 'Use a different font stack only if the default page typography is a problem.', title: 'Use system fonts when page fonts are noisy or oversized.', defaultValue: 'default', options: [
      { value: 'default', label: 'Default' },
      { value: 'system', label: 'System, slightly larger' },
      { value: 'compact', label: 'Compact, more legible' },
      { value: 'serif', label: 'Serif, quiet' }
    ] },
    { key: 'animationMode', section: 'styling', type: 'select', label: 'Animation mode', description: 'Reduce CSS motion only if the page feels noisy.', title: 'Reduce or disable CSS transitions and animations to cut rendering work.', defaultValue: 'default', options: [
      { value: 'default', label: 'Default' },
      { value: 'reduced', label: 'Reduced (0.25x)' },
      { value: 'off', label: 'Off' }
    ] },

    { key: 'enableBlockPendo', section: 'blocking', type: 'toggle', label: 'Block Pendo', description: 'Block the Skytouch Pendo script.', title: 'Blocks the Skytouch Pendo script that can stall ChoiceADVANTAGE pages.', defaultValue: false },
    { key: 'enableBlockTelemetry', section: 'blocking', type: 'toggle', label: 'Block telemetry', description: 'Block mpulse and Techlab measurement scripts.', title: 'Blocks mpulse and Techlab third-party measurement scripts on ChoiceADVANTAGE pages.', defaultValue: false },
    { key: 'enableBlockAkamai', section: 'blocking', type: 'toggle', label: 'Block Akamai SW', description: 'Block the Akamai service-worker script path.', title: 'Blocks the Akamai service-worker script path used by the page head installer.', defaultValue: false },
    { key: 'blockedHosts', section: 'blocking', type: 'textarea', label: 'Custom blocked hosts', title: 'One hostname per line. Comments after # are ignored, commas are allowed, and the first 50 custom hosts are used.', placeholder: 'example-cdn.com\ntracker.example.com', defaultValue: '', status: true, note: 'One hostname per line. Comments after # are ignored, commas are allowed, and the first 50 custom hosts are used.' },

    { key: 'enableNavPrefetch', section: 'performance', type: 'toggle', label: 'Prefetch nav targets', description: 'Prefetch links whose text matches the labels below.', title: 'Prefetch common navigation pages when you hover or focus their links.', defaultValue: false, status: true },
    { key: 'navPrefetchLabels', section: 'performance', type: 'textarea', label: 'Nav prefetch labels', title: 'One label per line or comma-separated. Matching link text will be prefetched on hover or focus.', placeholder: 'arrivals\ndepartures\nin-house', defaultValue: 'arrivals\ndepartures\nin-house', dependsOn: 'enableNavPrefetch', status: true, note: 'One label per line or comma-separated. Matching link text will be prefetched on hover or focus.' },
    { key: 'lazyLoadNoncriticalImages', section: 'performance', type: 'toggle', label: 'Lazy-load images', description: 'Delay noncritical welcome and login images.', title: 'Delay noncritical images until they are closer to view.', defaultValue: false },
    { key: 'hideNoncriticalImages', section: 'performance', type: 'toggle', label: 'Hide welcome/login images', description: 'Hide nonessential welcome and login images.', title: 'Hide nonessential welcome and login images to reduce layout work.', defaultValue: false }
  ];

  const FIELD_MAP = Object.fromEntries(FIELDS.map(field => [field.key, field]));
  const DEFAULTS = Object.fromEntries(FIELDS.map(field => [field.key, field.defaultValue]));
  DEFAULTS.rememberedUsername = '';

  const RESERVED_HOSTS = new Set(['choiceadvantage.com', 'remoteaccess.choiceadvantage.com', 'content.nps.skytouchnps.com', 's.go-mpulse.net', 's2.go-mpulse.net', 'p11.techlab-cdn.com']);
  const MAX_CUSTOM_HOSTS = 50;
  const MAX_REMEMBERED_USERNAMES = 20;

  const cleanText = value => String(value || '').trim();
  const splitLoose = value => String(value || '').split('\n').flatMap(line => line.split(',')).map(part => part.replace(/#.*/, '').trim()).filter(Boolean);
  const splitLines = value => String(value || '').split('\n').map(line => line.replace(/#.*/, '').trim()).filter(Boolean);
  const normalizeHost = host => cleanText(host).replace(/[,\s]+$/, '').toLowerCase().replace(/^\*\./, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const parseBlockedHosts = value => [...new Set(splitLoose(value).map(normalizeHost).filter(host => host && !RESERVED_HOSTS.has(host)))].slice(0, MAX_CUSTOM_HOSTS);
  const parseRememberedUsernames = value => {
    const seen = new Set();
    return splitLines(value).filter(username => {
      const key = username.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, MAX_REMEMBERED_USERNAMES);
  };
  const getPrimaryRememberedUsername = value => parseRememberedUsernames(value)[0] || '';
  const parseDnrEntries = value => String(value || '').split('\n').map(line => line.trim()).filter(Boolean);

  globalThis.CA_ENHANCED_SETTINGS = {
    DEFAULTS,
    FIELDS,
    FIELD_MAP,
    SECTIONS,
    RESERVED_HOSTS,
    MAX_CUSTOM_HOSTS,
    MAX_REMEMBERED_USERNAMES,
    cleanText,
    splitLoose,
    splitLines,
    normalizeHost,
    parseBlockedHosts,
    parseRememberedUsernames,
    getPrimaryRememberedUsername,
    parseDnrEntries
  };
})();
