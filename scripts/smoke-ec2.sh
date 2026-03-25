#!/usr/bin/env bash
# Run on the EC2 instance after PM2 is up (expects Next on 127.0.0.1:3000).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ok() { echo "OK $1"; }
fail() { echo "FAIL $1" >&2; exit 1; }

curl -sf -o /dev/null http://127.0.0.1:3000/ || fail "GET /"
ok "/"

curl -sf -o /dev/null http://127.0.0.1:3000/dashboard || fail "GET /dashboard"
ok "/dashboard"

echo "All smoke checks passed."
