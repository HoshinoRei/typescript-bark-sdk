#!/usr/bin/env bash
set -eu

file="${1:-/home/vscode/.claude.json}"

if [ -e "$file" ]; then
  tmp="$(mktemp)"

  jq 'if type != "object" then error(".claude.json must contain a JSON object") elif has("hasCompletedOnboarding") then . else . + {"hasCompletedOnboarding": true} end' "$file" > "$tmp"

  if cmp -s "$file" "$tmp"; then
    rm -f "$tmp"
  else
    mv "$tmp" "$file"
  fi
else
  printf '{\n  "hasCompletedOnboarding": true\n}\n' > "$file"
fi
