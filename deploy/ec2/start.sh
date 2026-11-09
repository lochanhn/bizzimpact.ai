#!/usr/bin/env bash
set -euo pipefail
image_tag=${1:?Usage: start.sh IMAGE_TAG}
deploy_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
frontend_data_dir="$deploy_dir/frontend-data"
for name in bizzimpact-website bizzimpact-backend; do
  if docker container inspect "$name" >/dev/null 2>&1; then
    printf 'Container %s already exists; inspect it before replacing it.\n' "$name" >&2
    exit 1
  fi
done
test -s "$deploy_dir/backend.env"
test -s "$deploy_dir/frontend.env"
docker image inspect "bizzimpact-backend:$image_tag" >/dev/null
docker image inspect "bizzimpact-website:$image_tag" >/dev/null
docker network inspect bizzimpact >/dev/null 2>&1 || docker network create bizzimpact
install -d -m 700 "$frontend_data_dir"
chown 1000:1000 "$frontend_data_dir"
docker run -d --name bizzimpact-backend --label app=bizzimpact \
  --restart unless-stopped --network bizzimpact \
  --memory 128m --memory-swap 256m --cpu-shares 256 --pids-limit 128 \
  --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
  --env-file "$deploy_dir/backend.env" \
  "bizzimpact-backend:$image_tag"
docker run -d --name bizzimpact-website --label app=bizzimpact \
  --restart unless-stopped --network bizzimpact \
  --memory 256m --memory-swap 512m --cpu-shares 256 --pids-limit 128 \
  --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 \
  --env-file "$deploy_dir/frontend.env" \
  --mount "type=bind,source=$frontend_data_dir,target=/app/data/runtime" \
  -p 127.0.0.1:3100:3000 \
  "bizzimpact-website:$image_tag"
