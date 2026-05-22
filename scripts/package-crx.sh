#!/usr/bin/env bash
set -euo pipefail

zip_file="${1:?usage: $0 input.zip output.crx [key.pem]}"
out="${2:?usage: $0 input.zip output.crx [key.pem]}"
key="${3:-}"
chrome="${CHROME_BIN:-google-chrome}"
source_dir="$(mktemp -d)"
trap 'rm -rf "$source_dir" "${source_dir}.crx" "${source_dir}.pem"' EXIT

unzip -q "$zip_file" -d "$source_dir"
args=(--headless --disable-gpu --no-sandbox "--pack-extension=$source_dir")
[[ -n "$key" ]] && args+=("--pack-extension-key=$key")

"$chrome" "${args[@]}"
mkdir -p "$(dirname "$out")"
mv "${source_dir}.crx" "$out"
