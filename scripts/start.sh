#!/usr/bin/env bash
# Start the CMS editor and the example consumer app together.
set -euo pipefail

cd "$(dirname "$0")/.."

CMS_PORT="${CMS_PORT:-5173}"
EXAMPLE_PORT="${EXAMPLE_PORT:-5174}"

# Fail fast if something already holds a port, and keep vite from silently
# drifting to the next free one.
require_free_port() {
  if lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $1 is already in use ($2). Stop it, or set ${3}=<other port>." >&2
    lsof -nP -iTCP:"$1" -sTCP:LISTEN >&2
    exit 1
  fi
}

require_free_port "$CMS_PORT" "CMS editor" CMS_PORT
if [ -f frontend-example/package.json ]; then
  require_free_port "$EXAMPLE_PORT" "example consumer" EXAMPLE_PORT
fi

pids=()
cleanup() {
  # Kill children first: `bun run` wraps vite, and killing only the wrapper
  # leaves vite holding the port.
  for pid in "${pids[@]:-}"; do
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

echo "CMS editor      -> http://localhost:$CMS_PORT"
bun run dev -- --port "$CMS_PORT" --strictPort &
pids+=($!)

if [ -f frontend-example/package.json ]; then
  echo "Example consumer -> http://localhost:$EXAMPLE_PORT"
  (cd frontend-example && bun run dev -- --port "$EXAMPLE_PORT" --strictPort) &
  pids+=($!)
else
  echo "Skipping example consumer: frontend-example/package.json not found."
fi

# bash 3.2 (macOS) has no `wait -n`: poll until any child exits.
while true; do
  for pid in "${pids[@]}"; do
    kill -0 "$pid" 2>/dev/null || exit 1
  done
  sleep 1
done
