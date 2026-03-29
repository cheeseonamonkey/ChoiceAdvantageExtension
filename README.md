# ChoiceAdvantage Enhanced v4.0

Minimal productivity extension for ChoiceAdvantage.

## Features

**DNR Highlighting**
- Red underline on flagged guest names
- Case insensitive with fuzzy matching
- Configure names in extension popup
- Custom hover reminder text and underline color

**Escape Key**
- Press Escape to click "Back" link
- Works anywhere on page (except input fields)
- Customizable Back link text

**Hide Columns / Rows**
- Right-click any column header
- Select "Hide Column" from Chrome context menu
- Column hides immediately (not saved between sessions)
- Right-click any table row and choose "Hide Row"
- Both context menu labels are configurable

**Username Memory**
- Optionally remembers usernames only
- Autofills likely login username fields when empty
- Never stores or autofills passwords

**Popup Settings**
- Toggle each feature on or off
- Edit DNR names and behavior labels from the popup

## Installation

1. Extract ZIP
2. Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. "Load unpacked" → select folder
5. Click extension icon to add DNR names

## Usage

**DNR Names**
- Click extension icon in toolbar
- Add names, one per line
- Format: `LAST, FIRST` or `FIRST LAST`
- Saves automatically

**Hide Columns / Rows**
1. Right-click any table column header
2. Chrome menu → "Hide Column"
3. Column disappears (refresh page to restore)
4. Right-click a row to use "Hide Row"

**Escape Key**
- Press Escape anywhere to go back
- Only works if "Back" link exists on page

**Remember Username**
- Enable it in the popup
- The extension remembers only the username/email text from login forms
- You can inspect or edit the saved username in the popup

## Technical

Files:
- `manifest.json` - MV3 extension config
- `background.js` - Service worker for context menus
- `content.js` - DNR highlighting, escape key, row/column hiding, username memory
- `options.html` - Popup UI
- `options.js` - Popup settings storage

Storage: `chrome.storage.sync` for DNR settings, feature toggles, menu labels, and remembered username only

Context Menu: Uses Chrome's contextMenus API (not custom implementation)

## License

Free to use and modify.
