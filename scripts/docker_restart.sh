#!/usr/bin/env bash
set -e
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-localdev-root-pwd}
MYSQL_DATABASE=${MYSQL_DATABASE:-zju_graduate_art_troupe}
MYSQL_USER=${MYSQL_USER:-zju_user}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-zju_pass}
export MYSQL_ROOT_PASSWORD MYSQL_DATABASE MYSQL_USER MYSQL_PASSWORD
docker compose down
docker compose up -d
for i in $(seq 1 60); do s=$(docker inspect --format '{{.State.Health.Status}}' zju_mysql 2>/dev/null || echo starting); echo "mysql health: $s"; [ "$s" = "healthy" ] && break; sleep 2; done
echo "compose restart done"

