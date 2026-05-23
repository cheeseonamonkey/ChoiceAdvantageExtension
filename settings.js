(function() {
  'use strict';

  const SECTIONS = [
    { key: 'core', title: 'Core', note: 'DNR, Escape back, and explicit test data.' },
    { key: 'guestProfile', title: 'Guest Profile', note: 'One-click fake guest form fill.' }
  ];
  const GUEST_PROFILE_SELECTORS = `firstName = #guestFirstName, [name="firstName"]
lastName = #guestLastName, [name="lastName"]
address1 = #guestAddressOne, [name="homeAddressOne"], [name="address1"]
address2 = #guestHomeAddressTwo, [name="homeAddressTwo"], [name="address2"]
city = #homeCity, [name="homeCity"], [name="city"]
state = #homeState, [name="homeState"], [name="state"]
zip = #guestHomeZip, [name="homeZip"], [name="zip"], [name="postalCode"]
country = #homeCountry, [name="homeCountry"], [name="country"]
email = [name="homeEmail"], [name="email"]
phone = [name="homePhone"], [name="phone"]`;
  const FIELDS = [
    { key: 'enableDNR', section: 'core', type: 'toggle', label: 'DNR highlighting', description: 'Underline matching names and show the hover reminder.', title: 'Underline and mark flagged guest names in tables.', defaultValue: true },
    { key: 'dnrList', section: 'core', type: 'textarea', label: 'DNR list', title: 'One guest per line. Use LAST, FIRST or FIRST LAST.', placeholder: 'Smith, John\nDoe, Jane', defaultValue: '', dependsOn: 'enableDNR', status: true, note: 'One guest per line. Use LAST, FIRST or FIRST LAST.' },
    { key: 'dnrTooltipText', section: 'core', type: 'text', label: 'Hover text', description: 'Text shown in the DNR hover reminder.', title: 'Text shown in the hover reminder for flagged DNR names.', defaultValue: 'Check DNR!', dependsOn: 'enableDNR' },
    { key: 'dnrHighlightColor', section: 'core', type: 'color', label: 'Underline color', description: 'Underline color for flagged DNR names.', title: 'Underline color for flagged DNR names.', defaultValue: '#dc3545', dependsOn: 'enableDNR' },
    { key: 'enableEscapeKey', section: 'core', type: 'toggle', label: 'Escape key back', description: 'Press Escape to activate the page Back link.', title: 'Press Escape to click a visible Back link outside editable fields.', defaultValue: true },
    { key: 'backLinkText', section: 'core', type: 'text', label: 'Back link regex', description: 'Link text pattern the Escape handler clicks.', title: 'Regular expression matched against visible link text.', defaultValue: '^Back$', dependsOn: 'enableEscapeKey', status: true },
    { key: 'enableTestData', section: 'core', type: 'toggle', label: 'Test-data context menu', description: 'Show explicit test-data inserts on editable fields.', title: 'Right-click editable fields to insert fake names and fixed payment test values.', defaultValue: true },
    { key: 'guestProfileSelectors', section: 'guestProfile', type: 'textarea', label: 'Field selectors', title: 'One key = selectors list per line. Label matching is tried after selectors.', placeholder: GUEST_PROFILE_SELECTORS, defaultValue: GUEST_PROFILE_SELECTORS, note: 'Keys: firstName, lastName, address1, address2, city, state, zip, country, email, phone.' }
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
