(function() {
  'use strict';

  const SECTIONS = [
    { key: 'core', title: 'Core', note: 'DNR, Escape back, and explicit test data.' },
    { key: 'guestProfile', title: 'Guest Profile', note: 'One-click fake guest form fill.' }
  ];
  const GUEST_PROFILE_SELECTORS = `firstName = #guestFirstName, [name="firstName"]
lastName = #guestLastName, [name="lastName"]
address1 = #guestAddressOne, [name="homeAddressOne"], [name="address1"]
city = #homeCity, [name="homeCity"], [name="city"]
state = #homeState, [name="homeState"], [name="state"]
zip = #guestHomeZip, [name="homeZip"], [name="zip"], [name="postalCode"]
country = #homeCountry, [name="homeCountry"], [name="country"]
email = [name="homeEmail"], [name="email"]
phone = [name="homePhone"], [name="phone"]`;
  const GUEST_FIRST_NAMES = 'Alex\nJordan\nMorgan\nTaylor\nCasey\nJamie';
  const GUEST_LAST_NAMES = 'Rivera\nBennett\nPatel\nNguyen\nCarter\nBrooks';
  const GUEST_ADDRESSES = `1842 Maple Ave | Denver | CO | 80202 | (303) 555-0142
271 Cedar St | Orlando | FL | 32801 | (407) 555-0178
955 Lake Shore Dr | Chicago | IL | 60601 | (312) 555-0116
603 Pine Way | Seattle | WA | 98101 | (206) 555-0194
1420 Park Rd | Phoenix | AZ | 85004 | (602) 555-0135
88 Peachtree Ln | Atlanta | GA | 30303 | (404) 555-0161`;
  const FIELDS = [
    { key: 'enableDNR', section: 'core', type: 'toggle', label: 'DNR highlighting', description: 'Underline matching names and show the hover reminder.', title: 'Underline and mark flagged guest names in tables.', defaultValue: true },
    { key: 'dnrList', section: 'core', type: 'textarea', label: 'DNR list', title: 'One guest per line. Use LAST, FIRST or FIRST LAST.', placeholder: 'Smith, John\nDoe, Jane', defaultValue: '', dependsOn: 'enableDNR', status: true, note: 'One guest per line. Use LAST, FIRST or FIRST LAST.' },
    { key: 'dnrTooltipText', section: 'core', type: 'text', label: 'Hover text', description: 'Text shown in the DNR hover reminder.', title: 'Text shown in the hover reminder for flagged DNR names.', defaultValue: 'Check DNR!', dependsOn: 'enableDNR' },
    { key: 'dnrHighlightColor', section: 'core', type: 'color', label: 'Underline color', description: 'Underline color for flagged DNR names.', title: 'Underline color for flagged DNR names.', defaultValue: '#dc3545', dependsOn: 'enableDNR' },
    { key: 'enableEscapeKey', section: 'core', type: 'toggle', label: 'Escape key back', description: 'Press Escape to activate the page Back link.', title: 'Press Escape to click a visible Back link outside editable fields.', defaultValue: true },
    { key: 'enableAutoFocus', section: 'core', type: 'toggle', label: 'Auto-focus dialogs', description: 'Automatically focus the OK/Yes button when modals appear.', title: 'Detects ChoiceAdvantage modals and focuses the primary confirmation button.', defaultValue: true },
    { key: 'enableKeepAlive', section: 'core', type: 'toggle', label: 'Session keep-alive', description: 'Prevents automatic logout by silently pinging the server.', title: 'Silent background heartbeat to prevent session timeouts.', defaultValue: true },
    { key: 'enableF12Block', section: 'core', type: 'toggle', label: 'Block F12 tools', description: 'Prevents F12 from opening browser devtools so the site can use its secret F12 menu.', title: 'Best-effort block for F12 and common devtools shortcuts so the page can keep using its own hidden F12 action.', defaultValue: true },
    { key: 'backLinkText', section: 'core', type: 'text', label: 'Back link regex', description: 'Link text pattern the Escape handler clicks.', title: 'Regular expression matched against visible link text.', defaultValue: '^Back$', dependsOn: 'enableEscapeKey', status: true },
    { key: 'enableTestData', section: 'core', type: 'toggle', label: 'Guest profile fill', description: 'Show the one-click guest-profile fill action.', title: 'Right-click ChoiceAdvantage pages or use the popup to fill fake guest profile data.', defaultValue: true },
    { key: 'enableSonLastNames', section: 'guestProfile', type: 'toggle', group: 'guestValues', label: 'Also make -son names', description: 'Adds first-name-derived last names like Alexanderson.', title: 'Include first-name-derived last names ending in son.', defaultValue: false },
    { key: 'guestFirstNames', section: 'guestProfile', type: 'textarea', group: 'guestValues', label: 'First names', title: 'One first name per line.', placeholder: GUEST_FIRST_NAMES, defaultValue: GUEST_FIRST_NAMES },
    { key: 'guestLastNames', section: 'guestProfile', type: 'textarea', group: 'guestValues', label: 'Last names', title: 'One last name per line.', placeholder: GUEST_LAST_NAMES, defaultValue: GUEST_LAST_NAMES },
    { key: 'guestAddresses', section: 'guestProfile', type: 'textarea', group: 'guestValues', label: 'Addresses', title: 'One address per line: street | city | state | zip | phone.', placeholder: GUEST_ADDRESSES, defaultValue: GUEST_ADDRESSES, note: 'Format: street | city | state | zip | phone.' },
    { key: 'guestProfileSelectors', section: 'guestProfile', type: 'textarea', group: 'guestSelectors', label: 'Field selectors', title: 'One key = selectors list per line. Label matching is tried after selectors.', placeholder: GUEST_PROFILE_SELECTORS, defaultValue: GUEST_PROFILE_SELECTORS, note: 'Keys: firstName, lastName, address1, city, state, zip, country, email, phone.' }
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
