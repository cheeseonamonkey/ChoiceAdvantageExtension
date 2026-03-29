// Background service worker - handles context menu
const DEFAULTS = {
  enableHideColumn: true,
  enableHideRow: true,
  hideColumnMenuText: 'Hide Column',
  hideRowMenuText: 'Hide Row'
};
const MENU_IDS = { column: 'hideColumn', row: 'hideRow' };

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
    try {
      syncContextMenu(items);
    } catch (e) {
      console.error('[CA Enhanced] Failed to sync context menu:', e);
    }
  });
}

chrome.runtime.onInstalled.addListener(loadContextMenu);
chrome.runtime.onStartup.addListener(loadContextMenu);

chrome.storage.onChanged.addListener((changes, area) => {
  try {
    if (area !== 'sync' || (!changes.enableHideColumn && !changes.enableHideRow && !changes.hideColumnMenuText && !changes.hideRowMenuText)) return;
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
