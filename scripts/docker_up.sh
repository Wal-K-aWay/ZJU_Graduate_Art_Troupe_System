#!/usr/bin/env bash
set -e
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-localdev-root-pwd}
MYSQL_DATABASE=${MYSQL_DATABASE:-zju_graduate_art_troupe}
MYSQL_USER=${MYSQL_USER:-zju_user}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-zju_pass}
export MYSQL_ROOT_PASSWORD MYSQL_DATABASE MYSQL_USER MYSQL_PASSWORD
docker compose up -d
if docker inspect --format '{{.State.Health.Status}}' zju_mysql >/dev/null 2>&1; then
  for i in $(seq 1 60); do s=$(docker inspect --format '{{.State.Health.Status}}' zju_mysql); echo "mysql health: $s"; [ "$s" = "healthy" ] && break; sleep 2; done
fi
echo "compose up done"

