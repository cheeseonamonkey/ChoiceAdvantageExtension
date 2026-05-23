# ChoiceAdvantage Enhanced v4.2

ChoiceAdvantage helper for DNR highlighting, Escape-to-Back, and guest-profile test-data fill.

[Repo](https://github.com/cheeseonamonkey/ChoiceAdvantageExtension) | [Releases](https://github.com/cheeseonamonkey/ChoiceAdvantageExtension/releases)

## What It Does
- Underlines DNR matches in table links.
- Shows a hover reminder for highlighted matches.
- Clicks the visible page Back link when Escape is pressed outside editable fields.
- Fills visible guest-profile fields with configurable fake names, address, email, and phone data.

## Install
1. Best non-dev-mode path: publish the zip to the Chrome Web Store or Edge Add-ons.
2. For local testing, extract the ZIP, open `chrome://extensions/`, enable Developer mode, and load unpacked.
3. For managed devices, use a signed CRX plus enterprise policy.

## Config
- `DNR list` is the guest-name list shown in the popup.
- `Hover text` and `Underline color` adjust the reminder.
- `Back link regex` is matched against visible link text before Escape clicks it.
- DNR highlighting, Escape back, and guest-profile filling each have their own popup checkbox.
- Guest-profile generated values and field selectors live under advanced controls.
- This release keeps the network-rule permission only to clear blocker rules from older installs.

## Automation
- CI checks syntax, validates `manifest.json`, rebuilds `options.css`, and uploads a zip artifact.
- `Dist` packages a clean zip on pushes to `main` / `master`.
- Release runs on `main` / `master` pushes and `v*` tags, then publishes both the zip and packaged CRX for the manifest version.
- Set the `CHROME_EXTENSION_PEM_BASE64` repository secret to a base64-encoded PEM key if release CRXs should keep the same extension ID across workflow runs.

## Troubleshooting
- Reload the extension at `chrome://extensions/` if it seems inactive.
- Warning badges in the popup mean a DNR entry needs both first and last names.
