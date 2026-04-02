#!/usr/bin/env bash
set -euo pipefail

out="${1:?usage: $0 output.zip}"
mkdir -p "$(dirname "$out")"
zip -r "$out" . -x '.git/*' '.github/*' '.serena/*' '.codex/*' 'logs/*' 'dist/*' 'options.tailwind.css' "$out"
