# ChoiceAdvantage Enhanced v4.1

Minimal CHOICEADVANTAGE productivity and performance extension.

## Features

### Performance Controls
- Block Pendo, mPulse, Techlab, and the Akamai SW path by default.
- Remove wasted preconnect/prefetch/preload hints that point at blocked telemetry hosts.
- Prefetch Arrivals, Departures, and In-House on hover/focus.
- Hide noncritical welcome/login images.
- Use animation modes for default behavior, reduced durations, or fully disabled motion.
- Add custom blocked hosts per page load.
- Abort matching `fetch` / async `XMLHttpRequest` URLs with a configurable timeout.
- Fix recurring page noise like mixed-content favicons, broken welcome image 404s, duplicate `ErrorMessageWriter` loads, login popup null errors, and stale font preloads.

### UI / Workflow
- DNR highlighting with configurable names and hover text.
- Escape key clicks Back.
- Hide rows and columns from the context menu.
- Remember username.
- Show on-page feedback when the extension auto-clicks or auto-hides something.

## Install
1. If you got a ZIP, extract it first. If you already have the folder, skip that step.
2. Open `chrome://extensions/`.
3. Enable Developer mode.
4. Load unpacked and select this folder.
5. Open the popup to configure it.
6. Reload the extension after any code changes.
7. Pin the extension if you want quick access to the popup.
8. If Chrome blocks a feature after an update, disable and re-enable the extension once.

### Update
1. Pull or replace the extension files.
2. Return to `chrome://extensions/`.
3. Click Reload on this extension.
4. Refresh any open ChoiceADVANTAGE tabs.

### First Run
1. Open ChoiceADVANTAGE in a fresh tab.
2. Open the extension popup.
3. Leave the performance defaults enabled unless a specific page breaks.
4. Add names to `DNR list` if you use guest-name highlighting.

## Usage

### Performance
- Keep `Block Pendo`, `Block telemetry`, and `Block Akamai SW` enabled unless a page proves it needs them.
- `Custom blocked hosts` accepts one hostname per line.
- Comments after `#` are ignored, commas are allowed, and the first 50 custom hosts are used.
- `Remove telemetry hints`, `Hide welcome/login images`, and `Animation mode` reduce page noise and rendering work.
- `Animation mode` supports `Default`, `Reduced (0.25x)`, and `Off`.
- `Abort matching requests` only affects the URL patterns you list, and only for page `fetch` / async `XMLHttpRequest`.
- `Prefetch nav targets` only prefetches same-origin HTTPS links whose visible text matches your label list.

### UI
- `DNR list` highlights matching guest names.
- `Remember username` saves only usernames/emails.
- `Back link text`, `Hide column menu label`, `Hide row menu label`, and `DNR hover text` are configurable.
- `Hide row` / `Hide column` are session-only, not persistent.
- Escape only works if the page has a Back link and focus is not in an input field.

### DNR Names
- Enter names one per line.
- Use `LAST, FIRST` or `FIRST LAST`.

## Troubleshooting
- If the extension seems inactive, reload the extension at `chrome://extensions/` and refresh the page.
- If a page breaks after changing a blocker, disable the last setting you touched and reload that tab.
- If a setting shows a warning badge in the popup, that value is incomplete, ignored, or not currently effective.

## Technical
- `manifest.json` - extension config and MV3 permissions
- `background.js` - service worker for context menus and dynamic network block rules
- `content.js` - early page sanitizers, page-script injection, DNR highlighting, Escape key, row/column hiding, and in-page feedback toasts
- `page.js` - page-context request-abort patch for matching `fetch` / XHR URLs
- `options.html` - popup UI for DNR and network settings
- `options.js` - settings storage

Storage uses `chrome.storage.sync` for DNR settings, UI labels, remembered username, and network block settings.

## Automation
- CI validates JS syntax and the MV3 manifest, then uploads a zip artifact on push and pull requests.
- Release builds the extension zip and attaches it to GitHub releases created from tags like `v4.1.0`.

## Removed Features

The extension intentionally stays lean and does not attempt fake browser controls such as:
- global request timeout overrides
- global cache expiry overrides
- forced async conversion for arbitrary page scripts

It does support targeted request aborts for configured `fetch` / `XMLHttpRequest` URL patterns, which is narrower and more reliable than pretending to control Chrome's network stack globally.

v4.x removes everything except core essentials:
- `Column save/restore` - hide only, no persistence
- `Date navigation`
- `Room quick find`
- `Table search`
- `CSV export`
- `Custom CSS`
- `Debug logs`
- `Per-user storage`

## License

Free to use and modify.

## Changelog
```text
v4.1 - performance blockers, page fixes, request aborts, nav prefetch, animation controls
```
