#!/usr/bin/env sh
command -v node >/dev/null 2>&1 || {
  echo "Node.js 18+ is required but not found in PATH."
  echo "Download from https://nodejs.org/"
  exit 1
}
node "$(dirname "$0")/launcher.js" "$@"
