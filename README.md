# ChoiceAdvantage Enhanced v4.1

Minimal CHOICEADVANTAGE productivity/performance extension.  
[Repo](https://github.com/cheeseonamonkey/ChoiceAdvantageExtension) | [Releases](https://github.com/cheeseonamonkey/ChoiceAdvantageExtension/releases)

## Features
- Blocks the slow extra scripts that tend to hang the page.
- Cleans up broken or noisy page bits like bad icons, useless image requests, and duplicate loads.
- Can preload common next pages like Arrivals, Departures, and In-House.
- Can stop certain requests sooner if you list them.
- Adds guest-name highlighting, Escape-to-Back, row/column hide, username memory, and small action popups.

## Install
1. If you have a ZIP, extract it. If you already have the folder, skip that.
2. Open `chrome://extensions/` and enable Developer mode.
3. Load unpacked and select this folder.
4. Open the popup, keep the defaults unless a page breaks, and reload after changes.

## Use
- `Custom blocked hosts` is a list of extra sites to skip.
- `Animation mode` can leave motion alone, slow it down, or turn it off.
- `Abort matching requests` only applies to the request words you enter.
- `Prefetch nav targets` only works for the next-page links you name.
- `DNR list` is the guest-name list; the popup shows how many names you entered.

## Layout
- `background.js` - dynamic block rules and context menus
- `content.js` - head sanitizers, DNR highlighting, Escape, row/column hide, toasts
- `page.js` - page-context request aborts
- `options.html` / `options.js` - popup UI and storage

## Automation
- CI validates JS syntax and `manifest.json`, then uploads a zip artifact.
- Release builds the zip and publishes it from `v*` tags.

## Troubleshooting
- Reload the extension at `chrome://extensions/` if it seems inactive.
- Disable the last blocker you changed if a page breaks.
- Warning badges in the popup mean the value is invalid, ignored, or disabled.

## License
Free to use and modify.
