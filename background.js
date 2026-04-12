// Background service worker - handles context menu and DNR rules.
importScripts('settings.js');

const { DEFAULTS, parseBlockedHosts } = globalThis.CA_ENHANCED_SETTINGS;

const MENU_IDS = { column: 'hideColumn', row: 'hideRow', choiceAdvantage: 'choiceAdvantage', fakeProfile: 'fakeProfile', fakeName: 'fakeName', fakeAddress: 'fakeAddress', fakePhone: 'fakePhone' };
const RULE_IDS = { blockPendo: 1, blockTelemetry: 2, blockAkamai: 3 };
const CUSTOM_RULE_START = 100;
const MAX_CUSTOM_RULES = 50;
const INITIATOR_DOMAINS = ['choiceadvantage.com', 'remoteaccess.choiceadvantage.com'];
const BLOCKED_RESOURCE_TYPES = ['script', 'xmlhttprequest', 'image', 'sub_frame'];
const PENDO_RULE = {
  id: RULE_IDS.blockPendo,
  priority: 1,
  action: { type: 'block' },
  condition: {
    initiatorDomains: INITIATOR_DOMAINS,
    requestDomains: ['content.nps.skytouchnps.com'],
    urlFilter: 'pendo.js',
    resourceTypes: BLOCKED_RESOURCE_TYPES
  }
};
const TELEMETRY_RULE = {
  id: RULE_IDS.blockTelemetry,
  priority: 1,
  action: { type: 'block' },
  condition: {
    initiatorDomains: INITIATOR_DOMAINS,
    requestDomains: ['s.go-mpulse.net', 's2.go-mpulse.net', 'p11.techlab-cdn.com'],
    resourceTypes: BLOCKED_RESOURCE_TYPES
  }
};
const AKAMAI_RULE = {
  id: RULE_IDS.blockAkamai,
  priority: 1,
  action: { type: 'block' },
  condition: {
    initiatorDomains: INITIATOR_DOMAINS,
    urlFilter: '/akam-sw',
    resourceTypes: ['script']
  }
};

const ruleForHost = (id, host) => ({
  id,
  priority: 1,
  action: { type: 'block' },
  condition: {
    initiatorDomains: INITIATOR_DOMAINS,
    requestDomains: [host],
    resourceTypes: BLOCKED_RESOURCE_TYPES
  }
});

function syncDynamicRules(settings) {
  const customRules = parseBlockedHosts(settings.blockedHosts).slice(0, MAX_CUSTOM_RULES).map((host, index) => ruleForHost(CUSTOM_RULE_START + index, host));
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [...Object.values(RULE_IDS), ...Array.from({ length: MAX_CUSTOM_RULES }, (_, index) => CUSTOM_RULE_START + index)],
    addRules: [settings.enableBlockPendo && PENDO_RULE, settings.enableBlockTelemetry && TELEMETRY_RULE, settings.enableBlockAkamai && AKAMAI_RULE, ...customRules].filter(Boolean)
  }, () => {
    if (chrome.runtime.lastError) console.error('[CA Enhanced] Dynamic rule sync failed:', chrome.runtime.lastError);
  });
}

function syncContextMenu(settings) {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Context menu reset failed:', chrome.runtime.lastError);
      return;
    }
    chrome.contextMenus.create({ id: MENU_IDS.choiceAdvantage, title: 'ChoiceAdvantage', contexts: ['editable'] }, () => {
      if (chrome.runtime.lastError) console.error('[CA Enhanced] Context menu creation failed:', chrome.runtime.lastError);
    });
    [
      { id: MENU_IDS.fakeProfile, title: 'Fill fake profile' },
      { id: MENU_IDS.fakeName, title: 'Fill fake name' },
      { id: MENU_IDS.fakeAddress, title: 'Fill fake address' },
      { id: MENU_IDS.fakePhone, title: 'Fill fake phone' }
    ].forEach(item => chrome.contextMenus.create({ ...item, parentId: MENU_IDS.choiceAdvantage, contexts: ['editable'] }, () => {
      if (chrome.runtime.lastError) console.error('[CA Enhanced] Context menu creation failed:', chrome.runtime.lastError);
    }));
    [
      settings.enableHideColumn && { id: MENU_IDS.column, title: settings.hideColumnMenuText || DEFAULTS.hideColumnMenuText },
      settings.enableHideRow && { id: MENU_IDS.row, title: settings.hideRowMenuText || DEFAULTS.hideRowMenuText }
    ].filter(Boolean).forEach(item => chrome.contextMenus.create({ ...item, contexts: ['all'] }, () => {
      if (chrome.runtime.lastError) console.error('[CA Enhanced] Context menu creation failed:', chrome.runtime.lastError);
    }));
  });
}

function loadExtensionState() {
  chrome.storage.sync.get(DEFAULTS, items => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Failed to load extension settings:', chrome.runtime.lastError);
      return;
    }
    try {
      syncContextMenu(items);
      syncDynamicRules(items);
    } catch (error) {
      console.error('[CA Enhanced] Failed to sync extension state:', error);
    }
  });
}

chrome.runtime.onInstalled.addListener(loadExtensionState);
chrome.runtime.onStartup.addListener(loadExtensionState);

chrome.storage.onChanged.addListener((changes, area) => {
  try {
    if (area !== 'sync') return;
    const changed = new Set(Object.keys(changes));
    if (changed.has('enableBlockPendo') || changed.has('enableBlockTelemetry') || changed.has('enableBlockAkamai') || changed.has('blockedHosts')) chrome.storage.sync.get(DEFAULTS, items => syncDynamicRules(items));
    if (changed.has('enableHideColumn') || changed.has('enableHideRow') || changed.has('hideColumnMenuText') || changed.has('hideRowMenuText')) chrome.storage.sync.get(DEFAULTS, items => syncContextMenu(items));
  } catch (error) {
    console.error('[CA Enhanced] Context menu update failed:', error);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  try {
    if (!info || !Object.values(MENU_IDS).includes(info.menuItemId) || !tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { action: info.menuItemId }, () => {
      if (chrome.runtime.lastError) console.warn('[CA Enhanced] Message send failed:', chrome.runtime.lastError.message);
    });
  } catch (error) {
    console.error('[CA Enhanced] Context menu click handler failed:', error);
  }
});
