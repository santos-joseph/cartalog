#!/bin/bash
set -e
cd "$(dirname "$0")"
node scripts/demo.mjs setup
node scripts/demo.mjs start --desktop
