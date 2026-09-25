#!/usr/bin/env bash
# Kept for anyone used to it. The real build is rebuild.py - validate the
# week, assemble the deck, write the script - and it runs anywhere Python does.
set -euo pipefail
exec python "$(dirname "$0")/rebuild.py" "$@"
