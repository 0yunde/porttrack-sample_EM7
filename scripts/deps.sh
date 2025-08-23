#!/usr/bin/env bash
set -e
cd /opt/porttrack/app/app
if [ -f package.json ]; then
  npm ci --omit=dev
fi
