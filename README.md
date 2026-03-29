# ChoiceAdvantage Enhanced v4.1

Minimal ChoiceADVANTAGE productivity and performance extension.

## Features

**Performance Controls**
- Block known slow third-party scripts like Pendo by default
- Block extra telemetry vendors like mPulse and Techlab by default
- Block the Akamai service-worker script path separately
- Strip wasted preconnect/prefetch/preload hints that target blocked telemetry hosts
- Add custom third-party hostnames to block per page load
- Apply configurable abort timeouts to matching page `fetch` and async `XMLHttpRequest` URLs
- Fix recurring page noise such as mixed-content favicon requests, broken welcome image 404s, duplicate error-writer loads, login popup null errors, and stale font preloads
- Uses Manifest V3 `declarativeNetRequest` rules instead of brittle DOM hacks

**DNR Highlighting**
- Red underline on flagged guest names
- Case insensitive with fuzzy matching
- Configure names in extension popup

**Escape Key**
- Press Escape to click "Back" link
- Works anywhere on page (except input fields)
- Shows an on-page toast when the link is auto-clicked

**Hide Table Rows/Columns**
- Right-click any column header
- Select "Hide Column" from Chrome context menu
- Column hides immediately (not saved between sessions)
- Right-click any row and use "Hide Row"
- Shows an on-page toast when a row/column is auto-hidden

## Installation

1. Extract ZIP
2. Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. "Load unpacked" → select folder
5. Click extension icon to configure names and network controls

## Usage

**Performance:**
- Leave `Block Pendo` enabled unless you specifically need it
- Leave `Block telemetry` enabled to suppress extra third-party measurement scripts
- Leave `Block Akamai SW` enabled unless you find a page that actually depends on the Akamai service-worker installer path
- Add one custom hostname per line under `Custom blocked hosts`
- Comments after `#` are ignored, commas are allowed, and the first 50 custom hosts are used
- The popup also has individual toggles for favicon repair, welcome image suppression, ErrorMessageWriter dedupe, login popup guarding, stale font preload removal, and telemetry-hint cleanup
- `Abort matching requests` is off by default and only affects URL patterns you explicitly list
- Request aborts apply to page `fetch` and async `XMLHttpRequest`, not generic browser-level script/network timeouts

**DNR Names:**
- Click extension icon in toolbar
- Add names, one per line
- Format: `LAST, FIRST` or `FIRST LAST`
- Saves automatically

**Hide Rows/Columns:**
1. Right-click any table column header
2. Chrome menu → "Hide Column"
3. Column disappears (refresh page to restore)
4. Right-click any row → "Hide Row" to hide a single row

**Escape Key:**
- Press Escape anywhere to go back
- Only works if "Back" link exists on page

## Technical

Files:
- `manifest.json` - Extension config and MV3 permissions
- `background.js` - Service worker for context menus and dynamic network block rules
- `content.js` - early page sanitizers, page-script injection, DNR highlighting, escape key, row/column hiding, and in-page feedback toasts
- `page.js` - page-context request-abort patch for matching `fetch`/XHR URLs
- `options.html` - Popup UI for DNR and network settings
- `options.js` - Settings storage

Storage: `chrome.storage.sync` for DNR settings, UI labels, remembered username, and network block settings

Context Menu: Uses Chrome's `contextMenus` API

Performance Blocking:
- `content.nps.skytouchnps.com` for Pendo
- `s.go-mpulse.net` / `s2.go-mpulse.net` for mPulse
- `p11.techlab-cdn.com` for Techlab
- Additional custom hosts from the popup

## Removed Features

The extension intentionally stays lean and does not attempt fake browser controls such as:
- global request timeout overrides
- global cache expiry overrides
- forced async conversion for arbitrary page scripts

It does support targeted request aborts for configured `fetch`/XHR URL patterns, which is narrower and more reliable than pretending to control Chrome's network stack globally.

v4.x removes everything except core essentials:
- ❌ Column save/restore (just hide, no persistence)
- ❌ Date navigation
- ❌ Room quick find
- ❌ Table search
- ❌ CSV export
- ❌ Custom CSS
- ❌ Debug logs
- ❌ Per-user storage

## License

Free to use and modify.
