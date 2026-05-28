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

function heartbeat() {
  chrome.storage.sync.get({ enableKeepAlive: DEFAULTS.enableKeepAlive }, settings => {
    if (settings.enableKeepAlive) {
      // Ping a standard ChoiceAdvantage endpoint to refresh the session
      fetch('https://www.choiceadvantage.com/choiceadvantage/main.do', { method: 'HEAD', cache: 'no-store' })
        .catch(() => { /* ignore - likely offline or blocked */ });
    }
  });
}

function syncAlarms() {
  chrome.storage.sync.get({ enableKeepAlive: DEFAULTS.enableKeepAlive }, settings => {
    if (settings.enableKeepAlive) {
      chrome.alarms.create('heartbeat', { periodInMinutes: 4 });
    } else {
      chrome.alarms.clear('heartbeat');
    }
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

function sendTabMessage(tabId, frameId, message, callback) {
  if (frameId == null) chrome.tabs.sendMessage(tabId, message, callback);
  else chrome.tabs.sendMessage(tabId, message, { frameId }, callback);
}

function mergeFillResult(best, response) {
  if (!response) return best;
  if (response.ok) return { ok: true, filled: response.filled || 0, expected: response.expected || 0 };
  return (response.filled || 0) > (best.filled || 0) ? response : best;
}

function sendProfileToFrames(tabId, frameIds, message, done) {
  let best = { ok: false, filled: 0, expected: 0 };
  let remaining = frameIds.length;
  frameIds.forEach(frameId => sendTabMessage(tabId, frameId, message, response => {
    if (!chrome.runtime.lastError) best = mergeFillResult(best, response);
    if (--remaining === 0) done(best);
  }));
}

function sendProfileToTab(tab, message, done) {
  chrome.webNavigation.getAllFrames({ tabId: tab.id }, frames => {
    const frameIds = chrome.runtime.lastError || !frames ? [0] : frames.map(frame => frame.frameId);
    sendProfileToFrames(tab.id, frameIds.length ? frameIds : [0], message, done);
  });
}

function sendProfile(tab, frameId, done = () => {}) {
  if (!tab || !tab.id) return done(false);
  chrome.storage.sync.get(DEFAULTS, settings => {
    if (chrome.runtime.lastError) {
      console.warn('[CA Enhanced] Guest profile settings load failed:', chrome.runtime.lastError.message);
      return done(false);
    }
    if (!settings.enableTestData) return done(false);
    const message = { action: 'fillGuestProfile', profile: guestProfile(settings) };
    if (frameId == null) return sendProfileToTab(tab, message, result => done(result.ok));
    sendTabMessage(tab.id, frameId, message, response => {
      if (!chrome.runtime.lastError && response && response.ok) return done(true);
      sendProfileToFrames(tab.id, frameId === 0 ? [0] : [frameId, 0], message, result => {
        if (!result.ok) console.warn('[CA Enhanced] Guest profile fill failed: no matching fields filled');
        done(result.ok);
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  syncMenus();
  syncAlarms();
  clearLegacyNetworkRules();
});
chrome.runtime.onStartup.addListener(() => {
  syncMenus();
  syncAlarms();
  clearLegacyNetworkRules();
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'heartbeat') heartbeat();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (changes.enableTestData) buildMenus(changes.enableTestData.newValue);
    if (changes.enableKeepAlive) syncAlarms();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.action !== 'fillActiveGuestProfile') return;
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => sendProfile(tabs[0], null, ok => sendResponse({ ok })));
  return true;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID) sendProfile(tab, info.frameId);
});
