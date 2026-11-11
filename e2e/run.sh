#!/usr/bin/env bash
# Boots the GoLearn stack for E2E runs and executes the Playwright suite.
#
#   ./e2e/run.sh              # boot stack + run all specs
#   ./e2e/run.sh specs/auth.spec.ts   # boot stack + run one spec
#
# Everything it starts is stopped again by ./e2e/stop.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_LOG=/tmp/golearn-api.log
WEB_LOG=/tmp/golearn-web.log
GATEWAY_LOG=/tmp/golearn-mockgw.log
WORKER_LOG=/tmp/golearn-worker.log

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

log "stop previous instances"
pkill -x golearn-api 2>/dev/null || true
pkill -x golearn-worker 2>/dev/null || true
pkill -x golearn-mockgw 2>/dev/null || true
pkill -f '[n]ext dev' 2>/dev/null || true
sleep 1

log "infra (postgres, redis, minio)"
docker compose -f deploy/docker-compose.yml up -d postgres redis minio minio-init >/dev/null

log "build api, worker, mock gateway"
(cd backend && go build -o /tmp/golearn-api ./cmd/api && go build -o /tmp/golearn-worker ./cmd/worker && go build -o /tmp/golearn-mockgw ./cmd/mockgateway)

log "reset rate-limit counters (rl:* in redis)"
reset_limits() {
  docker compose -f deploy/docker-compose.yml exec -T redis redis-cli --scan --pattern 'rl:*' 2>/dev/null \
    | xargs -r docker compose -f deploy/docker-compose.yml exec -T redis redis-cli DEL >/dev/null 2>&1 || true
}
reset_limits

log "start api, worker, mock gateway"
set -a; . ./.env; set +a
nohup /tmp/golearn-api >"$API_LOG" 2>&1 &
nohup /tmp/golearn-worker >"$WORKER_LOG" 2>&1 &
nohup /tmp/golearn-mockgw >"$GATEWAY_LOG" 2>&1 &

log "start frontend"
if curl -fsS -o /dev/null http://localhost:3000/ 2>/dev/null; then
  echo "  already running on :3000 — reusing it"
else
  rm -rf frontend/.next
  (cd frontend && nohup bun run dev >"$WEB_LOG" 2>&1 &)
fi

wait_for() { # url, label, tries
  for _ in $(seq 1 "${3:-60}"); do
    if curl -fsS -o /dev/null "$1" 2>/dev/null; then echo "  ok: $2"; return 0; fi
    sleep 1
  done
  echo "  TIMEOUT: $2 ($1)"; return 1
}

wait_gateway() { # label, tries — the gateway 404s unknown /start refs, so the
  # health probe opens (and throws away) a real session via POST /api/start
  for _ in $(seq 1 "${2:-30}"); do
    if curl -fsS -o /dev/null -X POST http://localhost:8082/api/start \
      -H 'Content-Type: application/json' \
      -d '{"ref":"healthz-e2e","callback":"http://localhost:3000/checkout/result"}' 2>/dev/null; then
      echo "  ok: $1"; return 0
    fi
    sleep 1
  done
  echo "  TIMEOUT: $1 (POST /api/start)"; return 1
}

wait_for http://localhost:8080/healthz "api" 90
wait_gateway "mock gateway" 30
wait_for http://localhost:3000/ "frontend" 120

log "playwright"
# clear the counters again right before the run: the login limiter is keyed by
# IP, and another local session can burn the budget while the stack boots
reset_limits
cd e2e
bunx playwright test "$@"
