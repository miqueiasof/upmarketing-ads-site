#!/usr/bin/env bash
# Builds the site and syncs dist/ to the nginx container folder on the VPS.
# --delete is safe: /portfolio is copied into dist/ by Eleventy passthrough,
# so it is always present in the synced tree.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
rsync -az --delete dist/ root@76.13.253.56:/docker/upmarketing/site/
