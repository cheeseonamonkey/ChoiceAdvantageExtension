// Background service worker - handles context menu
const DEFAULTS = {
  enableBlockPendo: true,
  enableBlockTelemetry: true,
  enableBlockAkamai: true,
  blockedHosts: '',
  enableHideColumn: true,
  enableHideRow: true,
  hideColumnMenuText: 'Hide Column',
  hideRowMenuText: 'Hide Row'
};
const MENU_IDS = { column: 'hideColumn', row: 'hideRow' };
const RULE_IDS = { blockPendo: 1, blockTelemetry: 2, blockAkamai: 3 };
const CUSTOM_RULE_START = 100;
const MAX_CUSTOM_RULES = 50;
const INITIATOR_DOMAINS = ['choiceadvantage.com', 'remoteaccess.choiceadvantage.com'];
const BLOCKED_RESOURCE_TYPES = ['script', 'xmlhttprequest', 'image', 'sub_frame'];
const RESERVED_HOSTS = new Set([...INITIATOR_DOMAINS, 'content.nps.skytouchnps.com', 's.go-mpulse.net', 's2.go-mpulse.net', 'p11.techlab-cdn.com']);
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

const normalizeHost = host => String(host || '')
  .trim()
  .replace(/#.*/, '')
  .replace(/[,\s]+$/, '')
  .toLowerCase()
  .replace(/^\*\./, '')
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');
const parseBlockedHosts = value => [...new Set(String(value || '')
  .split('\n')
  .flatMap(line => line.split(','))
  .map(normalizeHost)
  .filter(host => host && !RESERVED_HOSTS.has(host)))];
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
  const customRules = parseBlockedHosts(settings.blockedHosts).slice(0, MAX_CUSTOM_RULES).map((host, i) => ruleForHost(CUSTOM_RULE_START + i, host));
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [...Object.values(RULE_IDS), ...Array.from({ length: MAX_CUSTOM_RULES }, (_, i) => CUSTOM_RULE_START + i)],
    addRules: [settings.enableBlockPendo && PENDO_RULE, settings.enableBlockTelemetry && TELEMETRY_RULE, settings.enableBlockAkamai && AKAMAI_RULE, ...customRules].filter(Boolean)
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Dynamic rule sync failed:', chrome.runtime.lastError);
    }
  });
}

function syncContextMenu(settings) {
  chrome.contextMenus.removeAll(() => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Context menu reset failed:', chrome.runtime.lastError);
      return;
    }
    [
      settings.enableHideColumn && { id: MENU_IDS.column, title: settings.hideColumnMenuText || DEFAULTS.hideColumnMenuText },
      settings.enableHideRow && { id: MENU_IDS.row, title: settings.hideRowMenuText || DEFAULTS.hideRowMenuText }
    ].filter(Boolean).forEach(item => chrome.contextMenus.create({ ...item, contexts: ['all'] }, () => {
      if (chrome.runtime.lastError) {
        console.error('[CA Enhanced] Context menu creation failed:', chrome.runtime.lastError);
      }
    }));
  });
}

function loadContextMenu() {
  chrome.storage.sync.get(DEFAULTS, items => {
    if (chrome.runtime.lastError) {
      console.error('[CA Enhanced] Failed to load extension settings:', chrome.runtime.lastError);
      return;
    }
    try {
      syncContextMenu(items);
      syncDynamicRules(items);
    } catch (e) {
      console.error('[CA Enhanced] Failed to sync extension state:', e);
    }
  });
}

chrome.runtime.onInstalled.addListener(loadContextMenu);
chrome.runtime.onStartup.addListener(loadContextMenu);

chrome.storage.onChanged.addListener((changes, area) => {
  try {
    if (area !== 'sync') return;
    if (changes.enableBlockPendo || changes.enableBlockTelemetry || changes.enableBlockAkamai || changes.blockedHosts) chrome.storage.sync.get(DEFAULTS, items => syncDynamicRules(items));
    if (!changes.enableHideColumn && !changes.enableHideRow && !changes.hideColumnMenuText && !changes.hideRowMenuText) return;
    chrome.storage.sync.get(DEFAULTS, items => syncContextMenu(items));
  } catch (e) {
    console.error('[CA Enhanced] Context menu update failed:', e);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  try {
    if (!info || !Object.values(MENU_IDS).includes(info.menuItemId) || !tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { action: info.menuItemId }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[CA Enhanced] Message send failed:', chrome.runtime.lastError.message);
      }
    });
  } catch (e) {
    console.error('[CA Enhanced] Context menu click handler failed:', e);
  }
});
