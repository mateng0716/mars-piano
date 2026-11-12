#!/usr/bin/env bash
# Update the existing piano static site only. Run as root on the Beijing host.
set -euo pipefail

archive=${1:?Usage: update-beijing.sh /home/ubuntu/mars-piano-<sha>.tar.gz}
archive=$(realpath "$archive")
name=$(basename "$archive")
if [[ ! $name =~ ^mars-piano-([0-9a-f]{12})\.tar\.gz$ ]]; then
  echo "Unexpected release archive name: $name" >&2
  exit 1
fi
version=${BASH_REMATCH[1]}
checksum="$archive.sha256"
base=/srv/agentcloud/apps/piano
release="$base/releases/$version"
staging="$base/releases/$version.staging"
current="$base/current"

test "$(id -u)" -eq 0
test -f "$archive"
test -f "$checksum"
test -L "$current"
test ! -e "$release"
test ! -e "$staging"
test ! -L "$staging"
test ! -e "$base/current.next"
test ! -L "$base/current.next"
test ! -e "$base/current.rollback"
test ! -L "$base/current.rollback"
old_target=$(readlink "$current")
case "$old_target" in releases/*) ;; *) echo "Unexpected current target: $old_target" >&2; exit 1;; esac

(
  cd "$(dirname "$archive")"
  sha256sum -c "$(basename "$checksum")"
)
while IFS= read -r entry; do
  case "$entry" in
    /*|../*|*/../*|*'/..') echo "Unsafe archive path: $entry" >&2; exit 1;;
  esac
done < <(tar -tzf "$archive")

activated=0
rollback(){
  if [[ $activated -eq 1 ]]; then
    ln -s "$old_target" "$base/current.rollback"
    mv -Tf "$base/current.rollback" "$current"
    systemctl restart gotomars-piano.service || true
    echo "Health check failed; restored $old_target" >&2
  fi
}
trap rollback ERR

install -d -m 0755 "$staging"
tar --no-same-owner -xzf "$archive" -C "$staging"
for required in index.html style.css app.js course-data.js music-data.js lesson-visuals.js assets/piano/steinway-splendid/C4.m4a; do
  test -f "$staging/$required"
done
chown -R root:root "$staging"
chmod -R a+rX "$staging"
mv -T "$staging" "$release"
ln -s "releases/$version" "$base/current.next"
mv -Tf "$base/current.next" "$current"
activated=1

# Backward-compatible serving layer: entry pages never use stale conditional caches.
install -m 0644 "$release/deployment/serve.py" "$base/serve.py"
install -d -m 0755 /etc/systemd/system/gotomars-piano.service.d
if [[ -f /etc/systemd/system/gotomars-piano.service.d/cache.conf ]]; then
  cp -a /etc/systemd/system/gotomars-piano.service.d/cache.conf "$base/cache.conf.before-$version"
fi
cat > /etc/systemd/system/gotomars-piano.service.d/cache.conf <<'UNIT'
[Service]
ExecStart=
ExecStart=/usr/bin/python3 /srv/agentcloud/apps/piano/serve.py --port 19080 --bind 127.0.0.1 --directory /srv/agentcloud/apps/piano/current
UNIT
systemctl daemon-reload
systemctl restart gotomars-piano.service
for attempt in 1 2 3 4 5; do
  if curl --fail --silent -o /dev/null http://127.0.0.1:19080/; then break; fi
  sleep 1
done

systemctl is-active --quiet gotomars-piano.service
curl --fail --silent --show-error --max-time 10 -o /dev/null http://127.0.0.1:19080/
curl --fail --silent --show-error --max-time 10 -o /dev/null http://127.0.0.1:19080/music-data.js
curl --fail --silent --show-error --max-time 10 -o /dev/null http://127.0.0.1:19080/lesson-visuals.js
curl --fail --silent --show-error --max-time 10 -o /dev/null http://127.0.0.1:19080/assets/piano/steinway-splendid/C4.m4a
grep -q 'music-data.js' "$release/index.html"
grep -q 'lesson-visuals.js' "$release/index.html"
trap - ERR
printf 'Current release: %s\nPrevious release: %s\n' "$version" "$old_target"
