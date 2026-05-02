#!/usr/bin/env bash
set -eu

volume_name="${1:-claude-code-config}"
uid="${2:-1000}"
gid="${3:-1000}"

docker volume inspect "$volume_name" >/dev/null 2>&1 || docker volume create "$volume_name" >/dev/null

docker run --rm \
  -v "$volume_name:/claude-config" \
  alpine \
  sh -c "chown -R $uid:$gid /claude-config"
