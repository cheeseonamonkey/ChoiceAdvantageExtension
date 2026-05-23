// Background service worker for explicit editable-field test-data inserts.
importScripts('settings.js');

const { DEFAULTS } = globalThis.CA_ENHANCED_SETTINGS;
const MENU_IDS = {
  root: 'caTestData',
  firstName: 'caTestFirstName',
  lastName: 'caTestLastName',
  fullName: 'caTestFullName',
  guestProfile: 'caTestGuestProfile',
  address: 'caTestAddress',
  street: 'caTestStreet',
  unit: 'caTestUnit',
  city: 'caTestCity',
  state: 'caTestState',
  zip: 'caTestZip',
  phone: 'caTestPhone',
  expiry: 'caTestExpiry'
};
const TEST_CARDS = [
  ['Visa', '4242424242424242'],
  ['Mastercard', '5555555555554444'],
  ['American Express', '378282246310005'],
  ['Discover', '6011111111111117']
];
const FIRST_NAMES = ['Alex', 'Jordan', 'Morgan', 'Taylor', 'Casey', 'Jamie'];
const LAST_NAMES = ['Rivera', 'Bennett', 'Patel', 'Nguyen', 'Carter', 'Brooks'];
const ADDRESS_PROFILES = [
  { street: '1842 Maple Ave', unit: 'Apt 4B', city: 'Denver', state: 'CO', zip: '80202', phone: '(303) 555-0142' },
  { street: '271 Cedar St', unit: 'Suite 208', city: 'Orlando', state: 'FL', zip: '32801', phone: '(407) 555-0178' },
  { street: '955 Lake Shore Dr', unit: 'Unit 12', city: 'Chicago', state: 'IL', zip: '60601', phone: '(312) 555-0116' },
  { street: '603 Pine Way', unit: 'Apt 9', city: 'Seattle', state: 'WA', zip: '98101', phone: '(206) 555-0194' },
  { street: '1420 Park Rd', unit: 'Suite 31', city: 'Phoenix', state: 'AZ', zip: '85004', phone: '(602) 555-0135' },
  { street: '88 Peachtree Ln', unit: 'Floor 3', city: 'Atlanta', state: 'GA', zip: '30303', phone: '(404) 555-0161' }
];
const ADDRESS_KEYS = {
  [MENU_IDS.street]: 'street',
  [MENU_IDS.unit]: 'unit',
  [MENU_IDS.city]: 'city',
  [MENU_IDS.state]: 'state',
  [MENU_IDS.zip]: 'zip',
  [MENU_IDS.phone]: 'phone'
};
const LEGACY_RULE_IDS = [1, 2, 3, ...Array.from({ length: 50 }, (_, index) => 100 + index)];
const CHOICEADVANTAGE_PAGES = ['https://choiceadvantage.com/*', 'https://*.choiceadvantage.com/*'];

const pick = values => values[Math.floor(Math.random() * values.length)];
const testDataMessage = value => value && value.action ? value : { action: 'insertTestData', value };
const menu = (id, title, parentId = MENU_IDS.root, contexts = ['editable']) => chrome.contextMenus.create({ id, title, parentId, contexts, documentUrlPatterns: CHOICEADVANTAGE_PAGES });

function buildMenus(enabled) {
  chrome.contextMenus.removeAll(() => {
    if (!enabled) return;
    chrome.contextMenus.create({ id: MENU_IDS.root, title: 'ChoiceAdvantage Test Data', contexts: ['page', 'editable'], documentUrlPatterns: CHOICEADVANTAGE_PAGES });
    menu(MENU_IDS.guestProfile, 'Fill guest profile', MENU_IDS.root, ['page', 'editable']);
    menu(MENU_IDS.firstName, 'First name');
    menu(MENU_IDS.lastName, 'Last name');
    menu(MENU_IDS.fullName, 'Full name');
    menu(MENU_IDS.address, 'Address');
    menu(MENU_IDS.street, 'Street address', MENU_IDS.address);
    menu(MENU_IDS.unit, 'Address line 2', MENU_IDS.address);
    menu(MENU_IDS.city, 'City', MENU_IDS.address);
    menu(MENU_IDS.state, 'State', MENU_IDS.address);
    menu(MENU_IDS.zip, 'ZIP code', MENU_IDS.address);
    menu(MENU_IDS.phone, 'Phone number', MENU_IDS.address);
    menu(MENU_IDS.expiry, 'Expiry 12/34');
    TEST_CARDS.forEach(([brand]) => menu(`caTestCard:${brand}`, `${brand} test card`));
  });
}

function syncMenus() {
  chrome.storage.sync.get({ enableTestData: DEFAULTS.enableTestData }, settings => {
    if (chrome.runtime.lastError) return console.warn('[CA Enhanced] Test data menu load failed:', chrome.runtime.lastError.message);
    buildMenus(settings.enableTestData);
  });
}

function clearLegacyNetworkRules() {
  chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: LEGACY_RULE_IDS }, () => {
    if (chrome.runtime.lastError) console.warn('[CA Enhanced] Legacy network rule cleanup failed:', chrome.runtime.lastError.message);
  });
}

function valueFor(id) {
  if (id === MENU_IDS.firstName) return pick(FIRST_NAMES);
  if (id === MENU_IDS.lastName) return pick(LAST_NAMES);
  if (id === MENU_IDS.fullName) return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  if (id === MENU_IDS.expiry) return '12/34';
  return TEST_CARDS.find(([brand]) => id === `caTestCard:${brand}`)?.[1];
}

function guestProfile() {
  const address = pick(ADDRESS_PROFILES);
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return { firstName, lastName, address1: address.street, address2: address.unit, city: address.city, state: address.state, zip: address.zip, country: 'US', email: `${firstName}.${lastName}@example.test`.toLowerCase(), phone: address.phone };
}

function getAddressValue(info, tab, id, callback) {
  const key = ADDRESS_KEYS[id];
  if (!key) return callback();
  const profileKey = `addressProfileIndex:${tab.id}:${info.frameId || 0}`;
  chrome.storage.session.get(profileKey, settings => {
    const addressProfileIndex = settings[profileKey];
    const hasProfile = Number.isInteger(addressProfileIndex) && addressProfileIndex >= 0 && addressProfileIndex < ADDRESS_PROFILES.length;
    const nextIndex = id === MENU_IDS.street || !hasProfile ? Math.floor(Math.random() * ADDRESS_PROFILES.length) : addressProfileIndex;
    const insert = () => callback(ADDRESS_PROFILES[nextIndex][key]);
    if (nextIndex !== addressProfileIndex) chrome.storage.session.set({ [profileKey]: nextIndex }, insert);
    else insert();
  });
}

function sendInsert(info, tab, value) {
  if (!value || !tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, testDataMessage(value), info.frameId == null ? undefined : { frameId: info.frameId }, () => {
    if (chrome.runtime.lastError) console.warn('[CA Enhanced] Test data insert failed:', chrome.runtime.lastError.message);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  syncMenus();
  clearLegacyNetworkRules();
});
chrome.runtime.onStartup.addListener(() => {
  syncMenus();
  clearLegacyNetworkRules();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enableTestData) buildMenus(changes.enableTestData.newValue);
});

chrome.runtime.onMessage.addListener(message => {
  if (!message || message.action !== 'fillActiveGuestProfile') return;
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => sendInsert({}, tabs[0], { action: 'fillGuestProfile', profile: guestProfile() }));
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_IDS.guestProfile) return sendInsert(info, tab, { action: 'fillGuestProfile', profile: guestProfile() });
  if (ADDRESS_KEYS[info.menuItemId] && tab && tab.id) return getAddressValue(info, tab, info.menuItemId, value => sendInsert(info, tab, value));
  sendInsert(info, tab, valueFor(info.menuItemId));
});
