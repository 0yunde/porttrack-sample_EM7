#!/usr/bin/env bash
set -e
curl -fsS http://localhost:80/health || curl -fsS http://localhost:3000/health
