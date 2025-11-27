#!/usr/bin/env bash
set -e
MODE=${1:-docker}
TARGET=${2:-all}
DB_USER=${MYSQL_USER:-zju_user}
DB_PASS=${MYSQL_PASSWORD:-zju_pass}
DB_NAME=${MYSQL_DATABASE:-zju_graduate_art_troupe}
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}
CONTAINER=${CONTAINER_NAME:-zju_mysql}
run_sql_docker() { docker exec -i "$CONTAINER" mysql -u"$DB_USER" -p"$DB_PASS" "$@"; }
run_sql_local() { mysql -h "$DB_HOST" -P "$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$@"; }
if [ "$MODE" = "docker" ]; then
  command -v docker >/dev/null 2>&1 || { echo "docker not found"; exit 1; }
  docker ps -a --format '{{.Names}}' | grep -Fx "$CONTAINER" >/dev/null || { echo "container $CONTAINER not found"; exit 1; }
  HEALTH=$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "unknown")
  echo "container $CONTAINER health: $HEALTH"
  if [ "$TARGET" = "all" ] || [ "$TARGET" = "crud" ]; then run_sql_docker < mysql/test/crud_demo.sql; fi
  if [ "$TARGET" = "all" ] || [ "$TARGET" = "scenario" ]; then run_sql_docker < mysql/test/scenario_flow.sql; fi
  SUM_USERS=$(docker exec -i "$CONTAINER" mysql -N -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT COUNT(*) FROM users WHERE student_no IN ('TEST_ADMIN_0001','TEST_MEMBER_0001','SCENARIO_ADMIN_0001','SCENARIO_MEMBER_0001','SCENARIO_MEMBER_0002');")
  SUM_ATT=$(docker exec -i "$CONTAINER" mysql -N -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT COUNT(*) FROM attendance_projects WHERE title IN ('考勤测试项目1','场景-考勤项目A');")
  SUM_PERF=$(docker exec -i "$CONTAINER" mysql -N -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT COUNT(*) FROM performance_projects WHERE name IN ('演出测试项目1','场景-演出项目A');")
else
  run_sql_local -e "SELECT 1" >/dev/null
  if [ "$TARGET" = "all" ] || [ "$TARGET" = "crud" ]; then run_sql_local < mysql/test/crud_demo.sql; fi
  if [ "$TARGET" = "all" ] || [ "$TARGET" = "scenario" ]; then run_sql_local < mysql/test/scenario_flow.sql; fi
  SUM_USERS=$(mysql -N -h "$DB_HOST" -P "$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT COUNT(*) FROM users WHERE student_no IN ('TEST_ADMIN_0001','TEST_MEMBER_0001','SCENARIO_ADMIN_0001','SCENARIO_MEMBER_0001','SCENARIO_MEMBER_0002');")
  SUM_ATT=$(mysql -N -h "$DB_HOST" -P "$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT COUNT(*) FROM attendance_projects WHERE title IN ('考勤测试项目1','场景-考勤项目A');")
  SUM_PERF=$(mysql -N -h "$DB_HOST" -P "$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT COUNT(*) FROM performance_projects WHERE name IN ('演出测试项目1','场景-演出项目A');")
fi
echo "summary users=$SUM_USERS attendance_projects=$SUM_ATT performance_projects=$SUM_PERF"
if [ "$SUM_USERS" = "0" ] && [ "$SUM_ATT" = "0" ] && [ "$SUM_PERF" = "0" ]; then
  echo "tests ok"
else
  echo "tests incomplete"; exit 1
fi
