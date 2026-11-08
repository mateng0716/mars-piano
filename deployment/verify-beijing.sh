#!/usr/bin/env bash
set -euo pipefail
systemctl is-active gotomars-piano.service
readlink -f /srv/agentcloud/apps/piano/current
curl --fail --silent --show-error --max-time 10 --output /dev/null --write-out 'index HTTP %{http_code}\n' http://127.0.0.1:19080/
curl --fail --silent --show-error --max-time 10 --head http://127.0.0.1:19080/assets/piano/steinway-splendid/C4.m4a
