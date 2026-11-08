#!/usr/bin/env bash
# Add the piano vhost to the existing Caddy configuration after DNS is set.
set -euo pipefail

test "$(id -u)" -eq 0
active=/srv/agentcloud/apps/qiancheng/Caddyfile.active
caddy="$(readlink -f "$active")"
test -f "$caddy"
systemctl is-active --quiet gotomars-piano.service
if grep -Fq 'piano.gotomars.me {' "$caddy"; then
  echo 'Piano site already exists in Caddyfile' >&2
  exit 1
fi

backup="${caddy}.before-piano-$(date -u +%Y%m%dT%H%M%SZ)"
cp -p "$caddy" "$backup"
restore() {
  cp -p "$backup" "$caddy"
  docker exec gotomars-beijing-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile || true
  echo "Caddyfile restored from $backup" >&2
}
trap restore ERR

cat >> "$caddy" <<'CADDY'

piano.gotomars.me {
    tls {
        issuer acme {
            disable_tlsalpn_challenge
        }
    }
    reverse_proxy 127.0.0.1:19080
}
CADDY
docker exec gotomars-beijing-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec gotomars-beijing-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
trap - ERR
printf 'Caddyfile: %s\n' "$caddy"
printf 'Backup: %s\n' "$backup"
sha256sum "$caddy" "$backup"
