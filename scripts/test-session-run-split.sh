#!/usr/bin/env bash
# 本地验证 API / Worker 分离：启动双进程 + 可选向 BullMQ 投递探针 job。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_LOG="${TMPDIR:-/tmp}/agent-server-api-split.log"
WORKER_LOG="${TMPDIR:-/tmp}/agent-server-worker-split.log"
API_PID=""
WORKER_PID=""

cleanup() {
  if [[ -n "$API_PID" ]]; then kill "$API_PID" 2>/dev/null || true; fi
  if [[ -n "$WORKER_PID" ]]; then kill "$WORKER_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT

echo "==> build"
npm run build --silent

echo "==> start worker (HTTP off, worker on)"
SESSION_RUN_WORKER_ENABLED=1 \
SESSION_RUN_HTTP_ENABLED=0 \
SESSION_RUN_WORKER_CONCURRENCY=2 \
NODE_ENV=dev \
node dist/src/main.js >"$WORKER_LOG" 2>&1 &
WORKER_PID=$!
sleep 6

echo "==> start API (HTTP on, worker off)"
SESSION_RUN_WORKER_ENABLED=0 \
NODE_ENV=dev \
node dist/src/main.js >"$API_LOG" 2>&1 &
API_PID=$!
sleep 8

fail=0
assert_log() {
  local file=$1
  local pattern=$2
  local label=$3
  if grep -qE "$pattern" "$file"; then
    echo "  OK  $label"
  else
    echo "  FAIL $label (missing in $file)"
    fail=1
  fi
}

assert_not_log() {
  local file=$1
  local pattern=$2
  local label=$3
  if grep -qE "$pattern" "$file"; then
    echo "  FAIL $label (unexpected in $file)"
    fail=1
  else
    echo "  OK  $label"
  fi
}

echo "==> check startup logs"
assert_log "$API_LOG" 'producer-only|SESSION_RUN_WORKER_ENABLED=0' 'API: producer-only queue'
assert_log "$API_LOG" 'HTTP server listening' 'API: HTTP listening'
assert_not_log "$API_LOG" 'Session run BullMQ worker started' 'API: no worker consumer'

assert_log "$WORKER_LOG" 'HTTP disabled' 'Worker: HTTP disabled'
assert_log "$WORKER_LOG" 'Session run BullMQ worker started' 'Worker: consumer started'
assert_not_log "$WORKER_LOG" 'HTTP server listening' 'Worker: no HTTP listen'

echo "==> HTTP probe"
if curl -sf -o /dev/null "http://127.0.0.1:3030/docs"; then
  echo "  OK  API /docs reachable"
else
  echo "  FAIL API /docs not reachable"
  fail=1
fi

if curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3030/docs" 2>/dev/null; then
  if lsof -iTCP:3030 -sTCP:LISTEN 2>/dev/null | grep -q "$WORKER_PID"; then
    echo "  FAIL Worker holds port 3030"
    fail=1
  fi
fi

echo "==> enqueue probe job via BullMQ (worker should consume)"
node - <<'NODE'
require('./dist/src/core/env/load-env');
const { randomUUID } = require('node:crypto');
const { Queue } = require('bullmq');
const {
  buildSessionRunBullMqConnection,
} = require('./dist/src/core/session-run/session-run-bullmq.connection.util');
const { REDIS_KEY_PREFIX } = require('./dist/src/core/memory/shared/memory.constants');

async function main() {
  const connection = buildSessionRunBullMqConnection();
  if (!connection) {
    console.error('Redis not configured');
    process.exit(1);
  }
  const queue = new Queue('session-run', {
    connection,
    prefix: `${REDIS_KEY_PREFIX}bullmq`,
  });
  const jobId = randomUUID();
  await queue.add(
    'run',
    {
      runJob: {
        jobId,
        kind: 'chat_turn',
        sessionId: 'split-test-session',
        userId: 1,
        appClientId: 1,
        input: 'split-test-probe',
        enqueueGeneration: 0,
      },
    },
    { jobId },
  );
  await queue.close();
  console.log(`  enqueued probe jobId=${jobId}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
NODE

sleep 5
if grep -qE 'split-test|processQueuedJob|session run job failed sessionId=split-test-session|skip stale session run job sessionId=split-test-session' "$WORKER_LOG"; then
  echo "  OK  Worker handled probe job (see worker log)"
else
  echo "  FAIL Worker did not log probe job handling"
  fail=1
fi

echo ""
echo "==> API log: $API_LOG"
echo "==> Worker log: $WORKER_LOG"
if [[ "$fail" -ne 0 ]]; then
  echo "SPLIT TEST FAILED"
  exit 1
fi
echo "SPLIT TEST PASSED"
