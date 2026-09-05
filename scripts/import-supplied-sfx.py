"""Copy original audio bytes; fix extensions for MP3s mislabeled WAV in the archives."""
import argparse
import hashlib
import json
import pathlib
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument("archive_directory", type=pathlib.Path)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
destination = root / "assets/audio/sfx"
destination.mkdir(parents=True, exist_ok=True)
selection = {
    "SFX-UI-ALL-2026-09-01.zip": [
        "SFX/UI/se_button_click.wav", "SFX/UI/se_icon_click.wav",
        "SFX/UI/se_battlewin.wav", "SFX/UI/se_battlelose.wav", "SFX/UI/se_gift.wav",
    ],
    "SFX-COMBAT-ALL-2026-09-01.zip": [
        "SFX/Combat/201800_se_atk.wav", "SFX/Combat/201800_se_s1.wav",
        "SFX/Combat/201800_se_s2.wav", "SFX/Combat/400500_se_s1_beaten.wav",
    ],
}
records = []
for archive_name, entries in selection.items():
    archive_path = args.archive_directory / archive_name
    with zipfile.ZipFile(archive_path) as archive:
        for entry in entries:
            data = archive.read(entry)
            name = pathlib.PurePosixPath(entry).name
            if data[:4] == b"RIFF" and data[8:12] == b"WAVE":
                codec = "pcm-wav"
            elif data[:3] == b"ID3" or (data[0] == 255 and data[1] & 224 == 224):
                codec = "mp3"
                name = pathlib.PurePosixPath(name).with_suffix('.mp3').name
            else:
                raise ValueError(f"Unrecognized audio encoding: {entry}")
            (destination / name).write_bytes(data)
            records.append({"file": name, "codec": codec, "archive": archive_name, "entry": entry,
                            "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
manifest = {
    "schema": "hon-viet-supplied-sfx/v1",
    "processing": "Original bytes, no re-encoding or synthesis. MP3-in-WAV-name files receive .mp3 extensions for correct MIME types.",
    "mappingNote": "Shared combat event defaults, not a verified Samkok character-to-Luc-Anh mapping. Replace event assignments when art direction supplies a per-hero sound sheet.",
    "files": records,
}
(destination / "sources.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps({"files": len(records), "bytes": sum(x["bytes"] for x in records)}))
