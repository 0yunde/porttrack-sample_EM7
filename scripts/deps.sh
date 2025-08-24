#!/usr/bin/env bash
set -e
cd /opt/porttrack/app/app
if [ -f package.json ]; then
  npm install --omit=dev
fi
