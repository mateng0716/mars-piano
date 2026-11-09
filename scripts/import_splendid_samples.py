"""Import the C2–C7 middle-velocity Steinway samples from Splendid Grand Piano.

Source: https://github.com/sfzinstruments/SplendidGrandPiano
The source repository identifies the AKAI samples as public domain.
"""

import base64
import json
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets/piano/steinway-splendid"
API = "https://api.github.com/repos/sfzinstruments/SplendidGrandPiano/contents/Samples"
SEMITONES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def fetch_json(url):
    result = subprocess.run(
        ["curl", "-fLSs", "--retry", "3", "--max-time", "35", url],
        check=True,
        capture_output=True,
    )
    return json.loads(result.stdout)


def eligible(entry):
    match = re.fullmatch(r"Mp ([A-G])(#?)(\d)\.flac", entry["name"])
    if not match:
        return None
    letter, sharp, octave = match.groups()
    midi = 12 * (int(octave) + 1) + SEMITONES[letter] + bool(sharp)
    return letter + sharp + octave if 36 <= midi <= 96 else None


def import_one(entry, note):
    output = DEST / f"{note}.m4a"
    if output.exists() and output.stat().st_size > 1000:
        return note, output.stat().st_size
    payload = fetch_json(f"{API}/{quote(entry['name'], safe='')}?ref=master")
    if payload.get("encoding") != "base64":
        raise RuntimeError(f"Cannot decode {entry['name']}")
    with tempfile.NamedTemporaryFile(suffix=".flac") as source:
        source.write(base64.b64decode(payload["content"]))
        source.flush()
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", source.name,
             "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(output)],
            check=True,
        )
    return note, output.stat().st_size


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    samples = [(entry, eligible(entry)) for entry in fetch_json(API)]
    samples = [(entry, note) for entry, note in samples if note]
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(import_one, entry, note) for entry, note in samples]
        for future in as_completed(futures):
            note, size = future.result()
            print(f"{note}: {size} bytes", flush=True)
    (DEST / "manifest.json").write_text(json.dumps({"notes": sorted(note for _, note in samples), "source": "https://github.com/sfzinstruments/SplendidGrandPiano", "layer": "Mp"}, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
