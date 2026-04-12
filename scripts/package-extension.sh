#!/usr/bin/env bash
set -euo pipefail

out="${1:?usage: $0 output.zip}"
mkdir -p "$(dirname "$out")"
rm -f "$out"
zip -r "$out" \
  manifest.json \
  background.js \
  content.js \
  settings.js \
  page.js \
  fake-data.js \
  jquery.min.js \
  options.html \
  options.css \
  icon16.png \
  icon.png \
  icon128.png
