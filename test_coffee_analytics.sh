#!/usr/bin/env bash
# =============================================================================
# Coffee Shop Analytics — Setup & Test Script
# =============================================================================
# Usage:
#   chmod +x test_coffee_analytics.sh
#   ./test_coffee_analytics.sh            # full run
#   ./test_coffee_analytics.sh --skip-ml  # skip Python ML service checks
#   ./test_coffee_analytics.sh --teardown # stop & remove all containers
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

# ── Config (override via env vars) ───────────────────────────────────────────
BASE_URL="${BASE_URL:-http://localhost:8080/api}"
APP_URL="${APP_URL:-http://localhost:8080}"
DB_HOST_PORT="${DB_HOST_PORT:-}"
RABBIT_PORT="${RABBIT_PORT:-}"
RABBIT_MANAGEMENT_PORT="${RABBIT_MANAGEMENT_PORT:-}"
RABBIT_URL="${RABBIT_URL:-}"
DB_CONTAINER="${DB_CONTAINER:-coffee_postgres}"
ML_CONTAINER="${ML_CONTAINER:-coffee_ml_service}"
DB_NAME="${DB_NAME:-coffee_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
APP_LOG="${APP_LOG:-/tmp/coffee-spring.log}"
SPRING_PID=""
AUTO_START_APP=true
SKIP_ML=false
TEARDOWN=false
PASS=0; FAIL=0; WARN=0

# ── Parse flags ───────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --skip-ml)  SKIP_ML=true ;;
    --teardown) TEARDOWN=true ;;
    --no-start-app) AUTO_START_APP=false ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
banner()  { echo -e "\n${BOLD}${BLUE}══ $* ══${RESET}"; }
info()    { echo -e "  ${CYAN}→${RESET} $*"; }
pass()    { echo -e "  ${GREEN}✓${RESET} $*"; ((PASS++)) || true; }
fail()    { echo -e "  ${RED}✗${RESET} $*"; ((FAIL++)) || true; }
warn()    { echo -e "  ${YELLOW}!${RESET} $*"; ((WARN++)) || true; }
die()     { echo -e "\n${RED}FATAL: $*${RESET}\n"; exit 1; }

require() {
  command -v "$1" &>/dev/null || die "'$1' is required but not installed."
}

# Pretty-print JSON if jq is available, otherwise raw
pretty() { command -v jq &>/dev/null && echo "$1" | jq . || echo "$1"; }

# HTTP helper — sets HTTP_BODY and HTTP_CODE in the current shell
http() {
  local method="$1" url="$2"; shift 2
  local response
  response=$(curl -s -w "\n__STATUS__%{http_code}" -X "$method" "$url" "$@") || true
  HTTP_CODE=$(echo "$response" | grep -o '__STATUS__[0-9]*' | grep -o '[0-9]*')
  HTTP_BODY=$(echo "$response" | sed 's/__STATUS__[0-9]*$//')
}

# Wait for a URL to return 2xx, with timeout
wait_for_http() {
  local label="$1" url="$2" max="${3:-60}"
  info "Waiting for $label to be ready …"
  local i=0
  while ! curl -sf "$url" &>/dev/null; do
    i=$((i + 1)); [ $i -ge $max ] && { fail "$label did not respond after ${max}s"; return 1; }
    sleep 2
  done
  pass "$label is up"
}

is_port_free() {
  local port="$1"
  python3 - "$port" <<'PY'
import socket
import sys

port = int(sys.argv[1])
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        sock.bind(("127.0.0.1", port))
    except OSError:
        sys.exit(1)
sys.exit(0)
PY
}

choose_port() {
  local current="$1"; shift
  if [ -n "$current" ]; then
    echo "$current"
    return 0
  fi

  local candidate
  for candidate in "$@"; do
    if is_port_free "$candidate"; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

resolve_runtime_ports() {
  DB_HOST_PORT=$(choose_port "${DB_HOST_PORT:-}" 55432 55433 55434 56432) \
    || die "Could not find a free host port for PostgreSQL"
  RABBIT_PORT=$(choose_port "${RABBIT_PORT:-}" 55672 55673 55674 56672) \
    || die "Could not find a free host port for RabbitMQ"
  RABBIT_MANAGEMENT_PORT=$(choose_port "${RABBIT_MANAGEMENT_PORT:-}" 55675 55676 55677 56675) \
    || die "Could not find a free host port for RabbitMQ management"
  RABBIT_URL="${RABBIT_URL:-http://localhost:${RABBIT_MANAGEMENT_PORT}}"
}

cleanup() {
  if [ -n "${SPRING_PID:-}" ] && kill -0 "$SPRING_PID" 2>/dev/null; then
    info "Stopping Spring Boot process ($SPRING_PID) …"
    kill "$SPRING_PID" 2>/dev/null || true
    wait "$SPRING_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

start_spring_boot() {
  info "Starting Spring Boot with DB port ${DB_HOST_PORT} and RabbitMQ port ${RABBIT_PORT} …"
  DB_HOST=localhost \
  DB_PORT="$DB_HOST_PORT" \
  DB_NAME="$DB_NAME" \
  DB_USER="$DB_USER" \
  DB_PASSWORD="$DB_PASSWORD" \
  RABBIT_HOST=localhost \
  RABBIT_PORT="$RABBIT_PORT" \
  RABBIT_USER=guest \
  RABBIT_PASSWORD=guest \
  ./mvnw spring-boot:run >"$APP_LOG" 2>&1 &
  SPRING_PID=$!

  info "Waiting up to 120s for Spring Boot …"
  local i=0
  while ! curl -sf "$BASE_URL/beans" >/dev/null 2>&1; do
    if ! kill -0 "$SPRING_PID" 2>/dev/null; then
      fail "Spring Boot process exited early"
      info "Last 40 log lines from $APP_LOG:"
      tail -40 "$APP_LOG" | sed 's/^/  | /' || true
      return 1
    fi
    i=$((i + 1))
    if [ "$i" -ge 60 ]; then
      fail "Spring Boot did not become ready within 120s"
      info "Last 40 log lines from $APP_LOG:"
      tail -40 "$APP_LOG" | sed 's/^/  | /' || true
      return 1
    fi
    sleep 2
  done
  pass "Spring Boot started successfully"
}

# ── Teardown mode ─────────────────────────────────────────────────────────────
if $TEARDOWN; then
  banner "Teardown"
  info "Stopping and removing containers …"
  docker compose down -v 2>/dev/null && pass "Containers removed" || warn "docker compose down failed (maybe already stopped)"
  exit 0
fi

# ── Preflight checks ──────────────────────────────────────────────────────────
banner "Preflight"
require curl
require docker
command -v jq &>/dev/null && pass "jq found (pretty output enabled)" || warn "jq not found — raw JSON will be shown"

[ -f "docker-compose.yml" ] || die "Run this script from the project root (docker-compose.yml not found)"

resolve_runtime_ports
info "Using host ports: postgres=${DB_HOST_PORT}, rabbitmq=${RABBIT_PORT}, rabbitmq-mgmt=${RABBIT_MANAGEMENT_PORT}"

# ── Step 1: Infrastructure ────────────────────────────────────────────────────
banner "Step 1 — Start infrastructure"

info "Starting postgres and rabbitmq …"
POSTGRES_HOST_PORT="$DB_HOST_PORT" \
RABBITMQ_PORT="$RABBIT_PORT" \
RABBITMQ_MANAGEMENT_PORT="$RABBIT_MANAGEMENT_PORT" \
docker compose up -d postgres rabbitmq

info "Waiting for Postgres …"
RETRIES=0
until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" &>/dev/null; do
  RETRIES=$((RETRIES + 1)); [ $RETRIES -ge 30 ] && die "Postgres did not become ready in 60s"
  sleep 2
done
pass "Postgres is ready"

wait_for_http "RabbitMQ management UI" "$RABBIT_URL" 60

# ── Step 2: Spring Boot ───────────────────────────────────────────────────────
banner "Step 2 — Spring Boot application"

if curl -sf "$BASE_URL/beans" &>/dev/null; then
  pass "Spring Boot is already running"
else
  warn "Spring Boot does not appear to be running on $BASE_URL"
  if $AUTO_START_APP; then
    start_spring_boot || die "Spring Boot did not start correctly"
  else
    info "Start it with: DB_PORT=$DB_HOST_PORT ./mvnw spring-boot:run"
    info "Waiting up to 120s for Spring Boot …"
    RETRIES=0
    until curl -sf "$BASE_URL/beans" &>/dev/null; do
      RETRIES=$((RETRIES + 1)); [ $RETRIES -ge 60 ] && die "Spring Boot did not start. Run 'DB_PORT=$DB_HOST_PORT ./mvnw spring-boot:run' and retry."
      sleep 2
    done
    pass "Spring Boot came up"
  fi
fi

# ── Step 3: Flyway migrations ─────────────────────────────────────────────────
banner "Step 3 — Flyway migrations"

check_table() {
  local tbl="$1"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='$tbl');" 2>/dev/null | grep -q 't' \
    && pass "Table '$tbl' exists" || fail "Table '$tbl' missing — migration may not have run"
}

check_column() {
  local tbl="$1" col="$2"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
    "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='$tbl' AND column_name='$col');" 2>/dev/null | grep -q 't' \
    && pass "Column '$tbl.$col' exists" || fail "Column '$tbl.$col' missing"
}

check_table "orders"
check_table "analytics_events"
check_table "stock_predictions"
check_table "beans"
check_table "users"
check_column "orders" "location"
check_column "analytics_events" "order_month"
check_column "analytics_events" "order_day_of_week"
check_column "analytics_events" "order_hour"

# ── Step 4: Auth ───────────────────────────────────────────────────────────────
banner "Step 4 — Authentication"

TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser_${TIMESTAMP}@coffee.test"

info "Registering a test customer …"
http POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"$TEST_EMAIL\",\"password\":\"password123\"}"
REG_BODY="$HTTP_BODY"

if [ "$HTTP_CODE" = "200" ]; then
  USER_TOKEN=$(echo "$REG_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  pass "Customer registered (HTTP $HTTP_CODE)"
else
  fail "Registration failed (HTTP $HTTP_CODE): $REG_BODY"
  USER_TOKEN=""
fi

info "Logging in as admin …"
http POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
ADMIN_BODY="$HTTP_BODY"

if [ "$HTTP_CODE" = "200" ]; then
  ADMIN_TOKEN=$(echo "$ADMIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  pass "Admin login successful (HTTP $HTTP_CODE)"
else
  fail "Admin login failed (HTTP $HTTP_CODE)"
  warn "Make sure V4__Add_admin_user.sql has run and password matches ADMIN_PASSWORD=${ADMIN_PASSWORD}"
  ADMIN_TOKEN=""
fi

# ── Step 5: Public endpoints ───────────────────────────────────────────────────
banner "Step 5 — Public endpoints"

info "GET /api/beans (public) …"
http GET "$BASE_URL/beans"
BEANS_BODY="$HTTP_BODY"
if [ "$HTTP_CODE" = "200" ]; then
  BEAN_COUNT=$(echo "$BEANS_BODY" | grep -o '"id"' | wc -l | tr -d ' ')
  pass "GET /beans → 200 ($BEAN_COUNT beans returned)"
  # Extract first bean ID for order tests
  BEAN_ID=$(echo "$BEANS_BODY" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
  [ -z "$BEAN_ID" ] && { warn "Could not extract a bean ID — defaulting to 1"; BEAN_ID=1; }
else
  fail "GET /beans → HTTP $HTTP_CODE"
  BEAN_ID=1
fi

info "GET /api/orders without token (should be 401/403) …"
http GET "$BASE_URL/orders" &>/dev/null || true
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  pass "Unauthenticated order access correctly rejected (HTTP $HTTP_CODE)"
else
  fail "Expected 401/403 but got HTTP $HTTP_CODE"
fi

# ── Step 6: Place orders (with location) ──────────────────────────────────────
banner "Step 6 — Place orders with location"

place_order() {
  local location="$1" qty="$2" token="$3"
  http POST "$BASE_URL/orders" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "{\"location\":\"$location\",\"items\":[{\"beanId\":$BEAN_ID,\"quantity\":$qty}]}"
}

ORDER_IDS=()

for location in NORTH SOUTH EAST WEST ONLINE; do
  if [ -n "$USER_TOKEN" ]; then
    info "Placing order from location: $location …"
    place_order "$location" 2 "$USER_TOKEN"
    ORDER_BODY="$HTTP_BODY"
    if [ "$HTTP_CODE" = "201" ]; then
      ORDER_ID=$(echo "$ORDER_BODY" | tr -d '"')
      ORDER_IDS+=("$ORDER_ID")
      pass "Order placed → ID $ORDER_ID (location=$location)"
    else
      fail "Order failed (HTTP $HTTP_CODE): $ORDER_BODY"
    fi
  else
    warn "Skipping order for $location — no user token"
  fi
  sleep 0.3
done

# ── Step 7: Verify analytics_events ───────────────────────────────────────────
banner "Step 7 — analytics_events table"

EVENT_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  "SELECT COUNT(*) FROM analytics_events;" 2>/dev/null | tr -d ' ')

if [ "${EVENT_COUNT:-0}" -gt 0 ]; then
  pass "analytics_events has $EVENT_COUNT rows"
else
  fail "analytics_events is empty — OrderService may not be writing events"
fi

info "Sample analytics_events rows:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT order_id, bean_id, location, quantity_kg, order_month, order_day_of_week, order_hour FROM analytics_events LIMIT 5;" 2>/dev/null || true

DISTINCT_LOCATIONS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  "SELECT COUNT(DISTINCT location) FROM analytics_events;" 2>/dev/null | tr -d ' ')

if [ "${DISTINCT_LOCATIONS:-0}" -gt 1 ]; then
  pass "Multiple distinct locations recorded ($DISTINCT_LOCATIONS)"
else
  warn "Only $DISTINCT_LOCATIONS distinct location(s) — expected multiple"
fi

# ── Step 8: RabbitMQ queues ────────────────────────────────────────────────────
banner "Step 8 — RabbitMQ queue verification"

check_queue() {
  local queue="$1"
  local result
  result=$(curl -sf -u guest:guest \
    "$RABBIT_URL/api/queues/%2F/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$queue'))" 2>/dev/null || echo "$queue")" \
    2>/dev/null) || true

  if [ -n "$result" ]; then
    local msgs
    msgs=$(echo "$result" | { grep -o '"messages":[0-9]*' || true; } | head -1 | { grep -o '[0-9]*' || true; })
    pass "Queue '$queue' exists (messages_ready=${msgs:-?})"
  else
    # Fallback: check via rabbitmqctl inside container
    local rabbit_container
    rabbit_container=$(docker ps --format '{{.Names}}' | grep -i rabbit | head -1)
    if [ -n "$rabbit_container" ]; then
      docker exec "$rabbit_container" rabbitmqctl list_queues name 2>/dev/null | grep -q "$queue" \
        && pass "Queue '$queue' exists (via rabbitmqctl)" \
        || fail "Queue '$queue' not found"
    else
      warn "Could not verify queue '$queue' — RabbitMQ container not found"
    fi
  fi
}

check_queue "ml.ingestion.queue"
check_queue "ml.analytics.queue"

# ── Step 9: Analytics REST endpoints ──────────────────────────────────────────
banner "Step 9 — Analytics REST endpoints (ADMIN)"

if [ -n "$ADMIN_TOKEN" ]; then

  info "GET /api/analytics/demand …"
  http GET "$BASE_URL/analytics/demand" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  DEMAND_BODY="$HTTP_BODY"
  if [ "$HTTP_CODE" = "200" ]; then
    DEMAND_COUNT=$(echo "$DEMAND_BODY" | { grep -o '"beanId"' || true; } | wc -l | tr -d ' ')
    pass "GET /analytics/demand → 200 ($DEMAND_COUNT demand records)"
    [ "$DEMAND_COUNT" -gt 0 ] && pretty "$DEMAND_BODY" | head -30 || true
  else
    fail "GET /analytics/demand → HTTP $HTTP_CODE"
  fi

  info "GET /api/analytics/demand/NORTH …"
  http GET "$BASE_URL/analytics/demand/NORTH" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  DEMAND_NORTH="$HTTP_BODY"
  if [ "$HTTP_CODE" = "200" ]; then
    pass "GET /analytics/demand/NORTH → 200"
  else
    fail "GET /analytics/demand/NORTH → HTTP $HTTP_CODE"
  fi

  info "GET /api/analytics/predictions …"
  http GET "$BASE_URL/analytics/predictions" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  PRED_BODY="$HTTP_BODY"
  if [ "$HTTP_CODE" = "200" ]; then
    PRED_COUNT=$(echo "$PRED_BODY" | { grep -o '"id"' || true; } | wc -l | tr -d ' ')
    pass "GET /analytics/predictions → 200 ($PRED_COUNT predictions)"
  else
    fail "GET /analytics/predictions → HTTP $HTTP_CODE"
  fi

  info "GET /api/analytics/predictions/$BEAN_ID …"
  http GET "$BASE_URL/analytics/predictions/$BEAN_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  PRED_HIST="$HTTP_BODY"
  if [ "$HTTP_CODE" = "200" ]; then
    pass "GET /analytics/predictions/$BEAN_ID → 200"
  else
    fail "GET /analytics/predictions/$BEAN_ID → HTTP $HTTP_CODE"
  fi

  info "GET /api/admin/predictions (legacy endpoint) …"
  http GET "$BASE_URL/admin/predictions" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  ADMIN_PRED="$HTTP_BODY"
  if [ "$HTTP_CODE" = "200" ]; then
    pass "GET /admin/predictions → 200"
  else
    fail "GET /admin/predictions → HTTP $HTTP_CODE"
  fi

  info "Verify analytics is blocked for non-admin …"
  if [ -n "$USER_TOKEN" ]; then
    http GET "$BASE_URL/analytics/demand" \
      -H "Authorization: Bearer $USER_TOKEN" &>/dev/null || true
    if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "401" ]; then
      pass "Analytics endpoint correctly rejects CUSTOMER role (HTTP $HTTP_CODE)"
    else
      fail "Analytics should reject CUSTOMER — got HTTP $HTTP_CODE"
    fi
  fi

else
  warn "Skipping analytics endpoint tests — no admin token"
fi

# ── Step 10: ML service ────────────────────────────────────────────────────────
banner "Step 10 — Python ML service"

if $SKIP_ML; then
  warn "Skipping ML service checks (--skip-ml flag set)"
else
  ML_RUNNING=false

  # Check if ml_service container is running
  if docker ps --format '{{.Names}}' | grep -q "$ML_CONTAINER"; then
    ML_RUNNING=true
    pass "ML service container '$ML_CONTAINER' is running"
  else
    warn "ML service container not running — starting it with a low train threshold for verification …"
    POSTGRES_HOST_PORT="$DB_HOST_PORT" \
    RABBITMQ_PORT="$RABBIT_PORT" \
    RABBITMQ_MANAGEMENT_PORT="$RABBIT_MANAGEMENT_PORT" \
    ML_MIN_TRAIN_ROWS="${ML_MIN_TRAIN_ROWS:-1}" \
    docker compose up -d --build ml_service

    if docker ps --format '{{.Names}}' | grep -q "$ML_CONTAINER"; then
      ML_RUNNING=true
      pass "ML service container '$ML_CONTAINER' is running"
    elif pgrep -f "python.*main.py" &>/dev/null; then
      ML_RUNNING=true
      pass "ML service running as local Python process"
    else
      warn "ML service not detected. Start it with one of:"
      info "  ML_MIN_TRAIN_ROWS=1 docker compose up -d --build ml_service"
      info "  cd ml_service && DB_PORT=$DB_HOST_PORT python main.py"
    fi
  fi

  if $ML_RUNNING; then
    info "Waiting up to 30s for ML service to write predictions …"
    RETRIES=0
    PRED_COUNT=0
    until [ "$PRED_COUNT" -gt 0 ] || [ $RETRIES -ge 15 ]; do
      PRED_COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM stock_predictions;" 2>/dev/null | tr -d ' ' || echo 0)
      RETRIES=$((RETRIES + 1)); sleep 2
    done

    if [ "${PRED_COUNT:-0}" -gt 0 ]; then
      pass "stock_predictions has $PRED_COUNT rows written by ML service"
      info "Sample predictions:"
      docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT bean_name, location, predicted_date, ROUND(recommended_restock_amount::numeric,2) AS restock_kg, restock_needed FROM stock_predictions ORDER BY predicted_date DESC, bean_name, location LIMIT 8;" 2>/dev/null || true
    else
      warn "stock_predictions still empty — ML service may need more data (MIN_TRAIN_ROWS)"
      info "Try setting ML_MIN_TRAIN_ROWS=1 and restarting ml_service"
    fi

    # Tail ML container logs if available
    if docker ps --format '{{.Names}}' | grep -q "$ML_CONTAINER"; then
      info "Last 10 ML service log lines:"
      docker logs "$ML_CONTAINER" --tail 10 2>&1 | sed 's/^/  | /'
    fi
  fi
fi

# ── Step 11: Date-range filter test ───────────────────────────────────────────
banner "Step 11 — Date range filtering"

if [ -n "$ADMIN_TOKEN" ]; then
  FROM=$(date -u -d '7 days ago' '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || \
        date -u -v-7d '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || \
        echo "2024-01-01T00:00:00")
  TO=$(date -u '+%Y-%m-%dT%H:%M:%S')

  http GET "$BASE_URL/analytics/demand?from=${FROM}&to=${TO}" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  DEMAND_RANGE="$HTTP_BODY"
  if [ "$HTTP_CODE" = "200" ]; then
    pass "Date-range filter → 200 (from=$FROM to=$TO)"
  else
    fail "Date-range filter → HTTP $HTTP_CODE"
  fi
else
  warn "Skipping date-range test — no admin token"
fi

# ── Step 12: DB summary ───────────────────────────────────────────────────────
banner "Step 12 — Database summary"

info "Row counts across all tables:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  'users'             AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'beans',             COUNT(*) FROM beans
UNION ALL SELECT 'orders',            COUNT(*) FROM orders
UNION ALL SELECT 'order_items',       COUNT(*) FROM order_items
UNION ALL SELECT 'analytics_events',  COUNT(*) FROM analytics_events
UNION ALL SELECT 'stock_predictions', COUNT(*) FROM stock_predictions
ORDER BY table_name;" 2>/dev/null || warn "Could not query table counts"

# ── Results ───────────────────────────────────────────────────────────────────
banner "Results"
TOTAL=$((PASS + FAIL + WARN))
echo -e "  ${GREEN}Passed:${RESET}   $PASS"
echo -e "  ${RED}Failed:${RESET}   $FAIL"
echo -e "  ${YELLOW}Warnings:${RESET} $WARN"
echo -e "  Total:    $TOTAL\n"

if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}All checks passed.${RESET}"
  exit 0
else
  echo -e "${RED}${BOLD}$FAIL check(s) failed — review output above.${RESET}"
  exit 1
fi
