// Background service worker for guest-profile test-data fills.
importScripts('settings.js');

const { DEFAULTS } = globalThis.CA_ENHANCED_SETTINGS;
const MENU_ID = 'caFillGuestProfile';
const LEGACY_RULE_IDS = [1, 2, 3, ...Array.from({ length: 50 }, (_, index) => 100 + index)];
const CHOICEADVANTAGE_PAGES = ['https://choiceadvantage.com/*', 'https://*.choiceadvantage.com/*'];

const pick = values => values[Math.floor(Math.random() * values.length)];
const lines = value => String(value || '').split('\n').map(line => line.trim()).filter(Boolean);
const configuredLines = (value, fallback) => lines(value).length ? lines(value) : lines(fallback);

function buildMenus(enabled) {
  chrome.contextMenus.removeAll(() => {
    if (enabled) chrome.contextMenus.create({ id: MENU_ID, title: 'Fill guest profile', contexts: ['page', 'editable'], documentUrlPatterns: CHOICEADVANTAGE_PAGES });
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

function parseAddress(line) {
  const [street, city, state, zip, phone] = line.split('|').map(part => part.trim());
  return street && city && state && zip && phone ? { street, city, state, zip, phone } : null;
}

function sonName(name) {
  return `${String(name || '').replace(/[^a-z]/gi, '')}son`.replace(/^./, char => char.toUpperCase());
}

function guestProfile(settings) {
  const firstNames = configuredLines(settings.guestFirstNames, DEFAULTS.guestFirstNames);
  const lastNames = configuredLines(settings.guestLastNames, DEFAULTS.guestLastNames);
  const addresses = configuredLines(settings.guestAddresses, DEFAULTS.guestAddresses).map(parseAddress).filter(Boolean);
  const firstName = pick(firstNames);
  const lastName = pick(settings.enableSonLastNames ? [...lastNames, ...firstNames.map(sonName)] : lastNames);
  const address = pick(addresses.length ? addresses : lines(DEFAULTS.guestAddresses).map(parseAddress).filter(Boolean));
  return { firstName, lastName, address1: address.street, city: address.city, state: address.state, zip: address.zip, country: 'US', email: `${firstName}.${lastName}@example.test`.toLowerCase(), phone: address.phone };
}

function sendProfile(tab, frameId) {
  if (!tab || !tab.id) return;
  chrome.storage.sync.get(DEFAULTS, settings => {
    if (chrome.runtime.lastError) return console.warn('[CA Enhanced] Guest profile settings load failed:', chrome.runtime.lastError.message);
    if (!settings.enableTestData) return;
    chrome.tabs.sendMessage(tab.id, { action: 'fillGuestProfile', profile: guestProfile(settings) }, frameId == null ? undefined : { frameId }, () => {
      if (chrome.runtime.lastError) console.warn('[CA Enhanced] Guest profile fill failed:', chrome.runtime.lastError.message);
    });
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
  if (message && message.action === 'fillActiveGuestProfile') chrome.tabs.query({ active: true, currentWindow: true }, tabs => sendProfile(tabs[0]));
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID) sendProfile(tab, info.frameId);
});
