#!/usr/bin/env bash
# First release of the static piano site on the existing Beijing host.
set -euo pipefail

archive=/home/ubuntu/mars-piano-f2bee874faca.tar.gz
checksum=/home/ubuntu/mars-piano-f2bee874faca.tar.gz.sha256
base=/srv/agentcloud/apps/piano
release="$base/releases/f2bee874faca"
service=/etc/systemd/system/gotomars-piano.service

test "$(id -u)" -eq 0
test -f "$archive"
test -f "$checksum"
cd /home/ubuntu
sha256sum -c "$(basename "$checksum")"
test ! -e "$base/current"
test ! -e "$release"
test ! -e "$service"
if ss -ltn | grep -q ':19080 '; then
  echo 'Port 19080 is already in use' >&2
  exit 1
fi

install -d -m 0755 "$base" "$base/releases" "$release"
tar --no-same-owner -xzf "$archive" -C "$release"
test -f "$release/index.html"
test -f "$release/app.js"
test -f "$release/course-data.js"
test -f "$release/assets/piano/steinway-splendid/C4.m4a"
chown -R root:root "$release"
chmod -R a+rX "$release"
ln -s "releases/f2bee874faca" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"

cat > "$service" <<'UNIT'
[Unit]
Description=GoToMars Piano static site
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/srv/agentcloud/apps/piano
ExecStart=/usr/bin/python3 -m http.server 19080 --bind 127.0.0.1 --directory /srv/agentcloud/apps/piano/current
Restart=on-failure
RestartSec=3
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
UNIT
chmod 0644 "$service"
systemctl daemon-reload
systemctl enable --now gotomars-piano.service
systemctl is-active --quiet gotomars-piano.service
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl --fail --silent --max-time 2 --output /dev/null http://127.0.0.1:19080/; then
    break
  fi
  sleep 0.5
done
curl --fail --silent --show-error --max-time 10 --output /dev/null http://127.0.0.1:19080/
curl --fail --silent --show-error --max-time 10 --head http://127.0.0.1:19080/assets/piano/steinway-splendid/C4.m4a
printf 'Staged release: %s\n' "$release"
printf 'Service: %s\n' "$(systemctl is-active gotomars-piano.service)"
