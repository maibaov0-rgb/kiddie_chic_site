#!/usr/bin/env bash
# Runs ON THE VPS (invoked by GitHub Actions over SSH). Pulls a prebuilt image,
# switches the web container to it, verifies it's actually serving real content,
# and rolls back automatically if it isn't. Never touches other kiddie_chic-unrelated
# containers on this shared server.
set -euo pipefail

IMAGE_TAG="${1:?usage: deploy.sh <image-tag>}"
cd /root/kiddie_chic
COMPOSE="docker compose -f docker-compose.prod.yml"
LAST_GOOD_FILE="/root/kiddie_chic/.last_good_tag"
HEALTH_URL="http://localhost:8090/"
HEALTH_MARKER="Kiddie Chic"

git fetch origin main
git reset --hard origin/main

echo "Pulling ghcr.io/maibaov0-rgb/kiddie_chic_site-web:${IMAGE_TAG}"
docker pull "ghcr.io/maibaov0-rgb/kiddie_chic_site-web:${IMAGE_TAG}"

PREVIOUS_TAG=""
if [ -f "$LAST_GOOD_FILE" ]; then
  PREVIOUS_TAG=$(cat "$LAST_GOOD_FILE")
fi

deploy_tag() {
  local tag="$1"
  IMAGE_TAG="$tag" $COMPOSE up -d --force-recreate web
}

check_healthy() {
  for i in $(seq 1 15); do
    sleep 4
    if curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null | grep -q "$HEALTH_MARKER"; then
      return 0
    fi
  done
  return 1
}

# Product/category pages use ISR with an empty generateStaticParams (the CI
# build has no DB access), so every path renders fresh on its first request
# after this container starts — otherwise the first real visitor per page
# pays that render+DB cost. Warm them all from the sitemap right after
# deploy so visitors only ever hit the cached version.
warm_cache() {
  # NEXT_PUBLIC_APP_URL (baked into sitemap.xml at build time) may not match
  # kiddiechic.ua exactly (e.g. an internal IP:port) — match any http(s) host
  # instead of hardcoding the domain, and never let a zero-match grep/pipefail
  # take down the whole deploy (that's what broke this the first time).
  local urls
  urls=$(curl -fsS --max-time 10 "http://localhost:8090/sitemap.xml" \
    | grep -oE '(<loc>|href=")https?://[^"<]*' \
    | sed -E 's#^(<loc>|href=")https?://[^/]+##' \
    | sort -u; true)
  if [ -z "$urls" ]; then
    echo "Cache warm-up: sitemap.xml empty or unreachable, skipping"
    return
  fi
  echo "Warming ISR cache for $(echo "$urls" | wc -l) URLs..."
  echo "$urls" | while IFS= read -r path; do
    curl -fsS --max-time 10 -o /dev/null "http://localhost:8090${path}" || true
  done
  echo "Cache warm-up done"
}

echo "Switching web container to tag: ${IMAGE_TAG}"
deploy_tag "$IMAGE_TAG"

if check_healthy; then
  echo "Health check passed for ${IMAGE_TAG}"
  warm_cache
  echo "$IMAGE_TAG" > "$LAST_GOOD_FILE"
  exit 0
fi

echo "Health check FAILED for ${IMAGE_TAG}"
docker logs --tail=40 kiddie_chic_web || true

if [ -n "$PREVIOUS_TAG" ] && [ "$PREVIOUS_TAG" != "$IMAGE_TAG" ]; then
  echo "Rolling back to last known-good tag: ${PREVIOUS_TAG}"
  deploy_tag "$PREVIOUS_TAG"
  if check_healthy; then
    echo "Rollback to ${PREVIOUS_TAG} succeeded. Deploy of ${IMAGE_TAG} FAILED."
    exit 1
  else
    echo "Rollback ALSO failed health check. Manual intervention required."
    exit 2
  fi
else
  echo "No previous good tag recorded — leaving failed container up for inspection."
  exit 1
fi
