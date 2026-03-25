#!/usr/bin/env bash
# Run locally before pushing to GitHub: build, lint, heuristic secret scan.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== npm run build =="
npm run build

echo "== npm run lint =="
npm run lint

echo "== heuristic scan (exclude placeholders) =="
if command -v rg >/dev/null 2>&1; then
  if rg -n --hidden --glob '!.git/*' --glob '!node_modules/*' \
    'sk-ant-api03-[0-9a-zA-Z_-]{10,}' .; then
    echo "ERROR: Possible live Anthropic key pattern found. Remove before publishing." >&2
    exit 1
  fi
  if rg -n --hidden --glob '!.git/*' --glob '!node_modules/*' \
    're_[0-9A-Za-z]{10,}' . --glob '!*.example' --glob '!.env.example'; then
    echo "WARNING: Possible Resend key pattern; confirm these are placeholders only." >&2
  fi
else
  echo "(install ripgrep 'rg' for optional secret scan)"
fi

echo "== done =="
