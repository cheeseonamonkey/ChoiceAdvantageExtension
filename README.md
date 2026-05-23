# ChoiceAdvantage Enhanced v4.2

Small Chrome/Edge extension for ChoiceAdvantage work:

- highlights DNR names in table links
- clicks the visible Back link when Escape is pressed outside editable fields
- fills visible guest-profile fields with configurable fake test data

## Install

### Unpacked

Use this for development or quick local installs.

1. Clone or download this repo.
2. Run `npm install` once if you need to rebuild popup CSS.
3. Open `chrome://extensions/` or `edge://extensions/`.
4. Enable Developer mode.
5. Click `Load unpacked` and select the repo folder.
6. After code changes, click the extension's Reload button on the extensions page.

### CRX

Use this when you want a packaged extension file.

1. Build the zip:

   ```sh
   scripts/package-extension.sh dist/choiceadvantage-enhanced.zip
   ```

2. Build the CRX:

   ```sh
   scripts/package-crx.sh dist/choiceadvantage-enhanced.zip dist/choiceadvantage-enhanced.crx
   ```

3. To keep the same extension ID, pass the same key each time:

   ```sh
   scripts/package-crx.sh dist/choiceadvantage-enhanced.zip dist/choiceadvantage-enhanced.crx key.pem
   ```

4. Install the CRX through enterprise policy or the browser's supported managed-extension flow.

## Use

- Right-click a ChoiceAdvantage page and choose `Fill guest profile`.
- Or open the extension popup, go to `Guest Profile`, and click `Fill current page`.
- The fill skips fields that are not present on the current page.
- Address line 2 is intentionally not filled by default.

## Settings

- `DNR list`: one guest per line. Use `LAST, FIRST` or `FIRST LAST`.
- `Hover text` and `Underline color`: DNR reminder styling.
- `Back link regex`: case-insensitive pattern matched against visible link text.
- `Guest profile fill`: enables the popup and context-menu fill action.
- `Guest Profile > Advanced generated values`: editable first names, last names, addresses, and optional `-son` last names.
- `Guest Profile > Advanced selectors`: override field selectors if ChoiceAdvantage markup changes.

## Build Workflow

- Rebuild popup CSS after editing `options.tailwind.css`:

  ```sh
  npm run build:css
  ```

- Package a zip:

  ```sh
  scripts/package-extension.sh dist/choiceadvantage-enhanced.zip
  ```

- Package a CRX:

  ```sh
  scripts/package-crx.sh dist/choiceadvantage-enhanced.zip dist/choiceadvantage-enhanced.crx
  ```

## Troubleshooting

- Reload the extension at `chrome://extensions/` after local changes.
- If `Fill current page` does nothing, confirm the active tab is a `choiceadvantage.com` page.
- Warning badges in the popup mean a setting needs attention, such as an invalid Back regex or incomplete DNR entry.
- This release keeps the network-rule permission only to clear blocker rules from older installs.
