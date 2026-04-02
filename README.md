# ChoiceAdvantage Enhanced v4.1

Compact ChoiceAdvantage helper for DNR highlighting, page cleanup, username memory, fast form fill, and a few low-friction performance tweaks.

[Repo](https://github.com/cheeseonamonkey/ChoiceAdvantageExtension) | [Releases](https://github.com/cheeseonamonkey/ChoiceAdvantageExtension/releases)

## What It Does
- Blocks the noisier third-party scripts and trims broken page bits.
- Highlights DNR matches, keeps Escape/back handy, and exposes hide-column / hide-row actions.
- Remembers usernames only on pages containing `User Login`.
- Adds quick fake profile/name/address/phone fill actions for editable forms.
- Prefetches likely next-page links and keeps the popup compact.

## Install
1. Best non-dev-mode path: publish the zip to the Chrome Web Store or Edge Add-ons.
2. For local testing, extract the ZIP, open `chrome://extensions/`, enable Developer mode, and load unpacked.
3. For managed devices, use a signed CRX plus enterprise policy.

## Popup
- `Main` holds DNR and the most-used controls.
- `Tools` holds Escape/back, hide-column, hide-row, and username memory.
- `Network` holds blockers, prefetch, and the lighter page-fix controls.

## Config
- `Font mode` can stay default, switch to slightly larger system fonts, use a more legible compact stack, or use a quiet serif stack.
- `Hide top bar` and `Hide Resource Center` trim extra page chrome.
- `Custom blocked hosts` adds extra request blocks.
- `DNR list` is the guest-name list shown at the top of the popup.

## Automation
- CI checks syntax, validates `manifest.json`, rebuilds `options.css`, and uploads a zip artifact.
- `Dist` packages a clean zip on pushes to `main` / `master`.
- Release rebuilds `options.css`, publishes the zip from `v*` tags, and marks the release latest.

## Troubleshooting
- Reload the extension at `chrome://extensions/` if it seems inactive.
- Disable the last thing you changed if a page breaks.
- Warning badges in the popup mean the value is invalid, ignored, or disabled.
