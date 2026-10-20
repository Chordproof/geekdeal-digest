#!/bin/sh
set -eu

# Minimal Cloudflare Pages build for the static MVP.
# Keep only the public site files in the deployment artifact.
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
OUT="${1:-$ROOT/dist-pages}"
rm -rf "$OUT"
mkdir -p "$OUT"
cp "$ROOT/index.html" "$ROOT/supabase-config.js" "$OUT/"
cp "$ROOT/_headers" "$OUT/"
