#!/usr/bin/env python3
"""Install the reviewed, unmodified Gitview trial without replacing dotfile symlinks.

macOS Apple Silicon only. Run from mise's herdr-gitview-install/uninstall tasks.
Release changes require reviewing the new payload and updating the pinned digest.
"""
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time

VERSION = "v0.5.0"
ASSET = "herdr-gitview-app-aarch64-apple-darwin"
SHA256 = "7d605022028eb70c253becb16b0900247f341d41ae61e67dc01c12dea25776ee"
ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / ".local/state/herdr-gitview"
HOME = Path.home() / ".config/herdr-app"
LAYOUT = HOME / "layouts/neverforest.json"
MANIFEST = STATE / "installed.json"


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def load(path):
    return json.loads(path.read_text())


def save(path, value):
    # Resolve before writing: an atomic rename of the link itself breaks mise.
    path.resolve().write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def changes(node):
    if node.get("id") == "changes":
        return node
    for child in node.get("children", []):
        found = changes(child)
        if found is not None:
            return found
    return None


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def files(folder):
    return {str(p.relative_to(folder)): digest(p) for p in folder.rglob("*")
            if p.is_file() and not any(x.startswith(".") for x in p.relative_to(folder).parts)
            and p.name not in ("jsconfig.json", "gpui-kit.d.ts", "herdr.d.ts")}


def install():
    if MANIFEST.exists():
        raise RuntimeError("Trial already installed; uninstall before reinstalling this pinned release.")
    if sys.platform != "darwin" or os.uname().machine != "arm64":
        raise RuntimeError("Only the reviewed macOS Apple Silicon bundle is pinned.")
    app = shutil.which("herdr-app")
    hc = shutil.which("hc")
    if not app or not hc:
        raise RuntimeError("herdr-app and hc must be on PATH.")
    status = json.loads(subprocess.check_output([app, "status"]))
    if status["layout"] != "neverforest":
        raise RuntimeError("Switch to neverforest before installing.")
    before = LAYOUT.read_text()
    keys_before = (HOME / "keys.json").read_text()
    if changes(json.loads(before))["content"] != {"mod": "changes"}:
        raise RuntimeError("Changes slot is not stock; refusing to replace it.")
    cache = STATE / VERSION
    cache.mkdir(parents=True, exist_ok=True)
    archive = cache / f"{ASSET}.tar.gz"
    if not archive.exists():
        run("gh", "release", "download", VERSION, "--repo", "ChmaraX/herdr-gitview",
            "--pattern", archive.name, "--dir", str(cache))
    if digest(archive) != SHA256:
        raise RuntimeError("Release bundle SHA-256 mismatch; nothing installed.")
    with tempfile.TemporaryDirectory(prefix="stage-", dir=STATE) as temp:
        temp = Path(temp)
        with tarfile.open(archive) as tar:
            # Python 3.9 (macOS system Python) has no extraction filters.
            for member in tar.getmembers():
                target = (temp / member.name).resolve()
                if (not str(target).startswith(str(temp) + os.sep)
                        or not (member.isfile() or member.isdir())):
                    raise RuntimeError(f"Unsafe archive member: {member.name}")
            tar.extractall(temp)
        bundle = temp / ASSET
        stage = temp / "home"
        (stage / "layouts").mkdir(parents=True)
        (stage / "layouts/neverforest.json").write_text(before)
        (stage / "keys.json").write_text(keys_before)
        shutil.copy2(HOME / "installed.json", stage / "installed.json")
        # Only status needs the real window's IPC. All file writes stay staged.
        proxy = temp / "herdr-app"
        proxy.write_text(f'#!/bin/sh\nif [ "$1" = status ]; then unset HERDR_APP_HOME; fi\nexec {shlex.quote(app)} "$@"\n')
        proxy.chmod(0o755)
        run("bash", str(bundle / "herdr-app/install.sh"), "--binary", str(bundle / "bin/herdr-gitview"),
            env={**os.environ, "HERDR_APP_HOME": str(stage), "HERDR_APP_BIN": str(proxy)})
        # This trial intentionally adds no shortcuts: both upstream keys are occupied.
        if load(stage / "keys.json") != json.loads(keys_before):
            raise RuntimeError("Installer would change keys; refusing.")
        mods = sorted(p.name for p in (stage / "mods").iterdir() if p.is_dir())
        for name in mods:
            if (HOME / "mods" / name).exists() or (HOME / "mods" / name).is_symlink():
                raise RuntimeError(f"Mod name collision: {name}; nothing installed.")
        save(stage / "mods/gitview/config.json", {
            "bin": str(HOME / "mods/gitview/bin/herdr-gitview"), "herdr_app": app, "hc": hc})
        if LAYOUT.read_text() != before or (HOME / "keys.json").read_text() != keys_before:
            raise RuntimeError("Live layout or keys changed during staging; retry.")
        backup = STATE / f"backup-{time.time_ns()}"
        backup.mkdir()
        for source, name in [(LAYOUT, "neverforest.json"), (HOME / "keys.json", "keys.json"),
                             (HOME / "installed.json", "installed.json")]:
            shutil.copy2(source, backup / name)
        record = {"version": VERSION, "sha256": SHA256, "backup": str(backup),
                  "layout_link": os.readlink(LAYOUT) if LAYOUT.is_symlink() else None,
                  "keys_link": os.readlink(HOME / "keys.json") if (HOME / "keys.json").is_symlink() else None,
                  "mods": {name: files(stage / "mods" / name) for name in mods}}
        save(MANIFEST, record)
        for name in mods:
            shutil.move(str(stage / "mods" / name), HOME / "mods" / name)
        layout = json.loads(before)
        changes(layout)["content"] = changes(load(stage / "layouts/neverforest.json"))["content"]
        save(LAYOUT, layout)
    print(f"Installed upstream {VERSION}. Rollback: mise run herdr-gitview-uninstall\nBackup: {backup}")


def uninstall():
    record = load(MANIFEST)
    # Refuse to delete code changed since installation; generated caches/types are ignored.
    for name, expected in record["mods"].items():
        folder = HOME / "mods" / name
        if folder.is_symlink() or (folder.exists() and files(folder) != expected):
            raise RuntimeError(f"{folder} changed since installation; inspect before removal.")
    layout = load(LAYOUT)
    slot = changes(layout)
    if slot and slot.get("content", {}).get("mod") == "gitview":
        slot["content"] = slot["content"]["props"]["replaces"]
        save(LAYOUT, layout)
    for name in record["mods"]:
        folder = HOME / "mods" / name
        if folder.exists():
            shutil.rmtree(folder)
    MANIFEST.rename(STATE / f"uninstalled-{time.time_ns()}.json")
    print("Restored the previous Changes content; keys and other layout edits untouched.")


if __name__ == "__main__":
    try:
        if os.environ.get("HERDR_APP_HOME"):
            raise RuntimeError("This trial targets the default app home; unset HERDR_APP_HOME.")
        {"install": install, "uninstall": uninstall}[sys.argv[1]]()
    except (KeyError, IndexError):
        sys.exit("Usage: herdr-gitview.py install|uninstall")
    except Exception as error:
        sys.exit(str(error))
