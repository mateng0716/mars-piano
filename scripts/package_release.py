#!/usr/bin/env python3
"""Build a deterministic static-site release from tracked product files."""
from pathlib import Path
import hashlib
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'deployment' / 'releases'
OUTPUT.mkdir(parents=True, exist_ok=True)
commit = subprocess.check_output(['git', 'rev-parse', '--short=12', 'HEAD'], cwd=ROOT, text=True).strip()
paths = [Path('index.html'), Path('style.css'), Path('home-layout.css'), Path('app.js'), Path('course-data.js'), Path('music-data.js'), Path('lesson-visuals.js'), Path('piano-input.js'), Path('piano-adventure.js'), Path('version.json'), Path('manifest.webmanifest')]
paths += [Path('deployment/serve.py')]
paths += [p.relative_to(ROOT) for p in sorted((ROOT / 'assets').rglob('*')) if p.is_file()]
archive = OUTPUT / f'mars-piano-{commit}.tar.gz'
with tarfile.open(archive, 'w:gz') as tar:
    for rel in paths:
        file = ROOT / rel
        if not file.is_file():
            raise FileNotFoundError(file)
        info = tar.gettarinfo(str(file), arcname=str(rel))
        info.uid = info.gid = 0
        info.uname = info.gname = ''
        info.mtime = int(subprocess.check_output(['git','show','-s','--format=%ct','HEAD'],cwd=ROOT,text=True).strip())
        with file.open('rb') as stream:
            tar.addfile(info, stream)
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(OUTPUT / (archive.name + '.sha256')).write_text(f'{digest}  {archive.name}\n')
print(f'{archive.name} files={len(paths)} bytes={archive.stat().st_size} sha256={digest}')
