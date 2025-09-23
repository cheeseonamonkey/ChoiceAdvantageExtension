# ChoiceAdvantageExtension
Browser extension adding a few features to Choice Advantage *(hotel software I use daily at work)*.

### Extension features:
  - Shortcuts:
    - Ctrl+Space:
       1. clicks `SAVE`/`SUBMIT` button
       2. clicks `Check In` link
    - Esc:
       1. clicks `CANCEL` button
       2. clicks `Back` link
    - `.` *(num pad)*:
      - triggers stock shortcut popup _(stock shortcuts do exist already as an obscure feature, but is stupidly bound to F12, which is the browser default to open dev tools)_
- Arrivals date navigation UI _(next/previous day)_
- Highlights names from hard-coded Do Not Rent (DNR) list

## Installation

- Download or clone this repository.
- Open Chrome and go to chrome://extensions/.
- Enable Developer mode (top right).
- Click Load unpacked and select the folder containing the extension files.
- The extension will load and activate on choiceadvantage.com pages.

#### Configure DNR list
The DNR list is currently hard-coded as a Javascript array. You may edit it before loading the extension.
