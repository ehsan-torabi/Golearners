#!/usr/bin/env bash
# Stops the processes started by ./e2e/run.sh (containers keep running).
set -uo pipefail

pkill -x golearn-api 2>/dev/null && echo "stopped api"
pkill -x golearn-worker 2>/dev/null && echo "stopped worker"
pkill -x golearn-mockgw 2>/dev/null && echo "stopped mock gateway"
pkill -f '[n]ext dev' 2>/dev/null && echo "stopped frontend"
exit 0
