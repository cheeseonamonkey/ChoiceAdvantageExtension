# ChoiceAdvantage Enhanced v4.2

ChoiceAdvantage helper for DNR highlighting, Escape-to-Back, and explicit editable-field test-data inserts.

[Repo](https://github.com/cheeseonamonkey/ChoiceAdvantageExtension) | [Releases](https://github.com/cheeseonamonkey/ChoiceAdvantageExtension/releases)

## What It Does
- Underlines DNR matches in table links.
- Shows a hover reminder for highlighted matches.
- Clicks the visible page Back link when Escape is pressed outside editable fields.
- Inserts fake names, coherent address parts, state-matched test phones, published test card numbers, and `12/34` from the editable-field context menu.

## Install
1. Best non-dev-mode path: publish the zip to the Chrome Web Store or Edge Add-ons.
2. For local testing, extract the ZIP, open `chrome://extensions/`, enable Developer mode, and load unpacked.
3. For managed devices, use a signed CRX plus enterprise policy.

## Config
- `DNR list` is the guest-name list shown in the popup.
- `Hover text` and `Underline color` adjust the reminder.
- `Back link text` is the exact link label Escape clicks.
- DNR highlighting, Escape back, and the test-data context menu each have their own popup checkbox.
- Choosing `Street address` starts the address profile used by its city, state, ZIP, address line 2, and phone menu entries.
- Card-number menu entries are fixed published test values for sandbox/test workflows.
- This release keeps the network-rule permission only to clear blocker rules from older installs.

## Automation
- CI checks syntax, validates `manifest.json`, rebuilds `options.css`, and uploads a zip artifact.
- `Dist` packages a clean zip on pushes to `main` / `master`.
- Release rebuilds `options.css`, publishes the zip from `v*` tags, and marks the release latest.

## Troubleshooting
- Reload the extension at `chrome://extensions/` if it seems inactive.
- Warning badges in the popup mean a DNR entry needs both first and last names.
