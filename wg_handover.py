from pathlib import Path
import subprocess
import re
import os
import zipfile
import sys

root = Path(__file__).resolve().parent
master = root / "WORLDS_GALLERY_HANDOVER_MASTER.md"
word = root / "WORLDS_GALLERY_FULL_PROJECT_HANDOVER.docx"
latest = root.parent / "WorldsGallery_LATEST_CHECKPOINT.zip"

def git(*args):
    result = subprocess.run(
        ["git", *args], cwd=root, text=True,
        encoding="utf-8", errors="replace", capture_output=True
    )
    if result.returncode:
        raise RuntimeError(
            "git " + " ".join(args) + "\n" + result.stderr
        )
    return result.stdout.strip()

def main():
    text = master.read_text(encoding="utf-8-sig")

    if len(text) < 20000 or "SINGLE CANONICAL HANDOVER" not in text:
        raise RuntimeError("Single master handover incomplete.")

    if word.exists():
        raise RuntimeError("Duplicate Word handover still exists.")

    if git("branch", "--show-current") != "main":
        raise RuntimeError("Expected main branch.")

    remote = git("remote", "get-url", "origin")

    if not re.search(
        r"github\.com[:/]potechto/worlds-gallery(?:\.git)?$",
        remote, re.I
    ):
        raise RuntimeError("Unexpected Git remote: " + remote)

    if git("diff", "--cached", "--name-only"):
        raise RuntimeError("Existing staged changes detected.")

    git("fetch", "--no-tags", "origin", "main")
    remote_sha = git("ls-remote", "origin", "refs/heads/main").split()[0]

    ancestry = subprocess.run(
        ["git", "merge-base", "--is-ancestor", remote_sha, "HEAD"],
        cwd=root
    )

    if ancestry.returncode:
        raise RuntimeError("Remote contains newer or divergent work.")

    stage = [
        "WORLDS_GALLERY_HANDOVER_MASTER.md",
        "wg_handover.py",
        ".gitignore"
    ]

    git("add", "--", *stage)

    if git("ls-files", "--", word.name):
        git("add", "-u", "--", word.name)

    staged = git("diff", "--cached", "--name-only").splitlines()

    if set(staged) - set(stage + [word.name]):
        raise RuntimeError("Unexpected files staged.")

    git("diff", "--cached", "--check")

    if staged:
        git(
            "commit", "-m",
            "Docs: consolidate Worlds Gallery into one master handover"
        )

    git("push", "origin", "main")

    head = git("rev-parse", "HEAD")
    verified = git("ls-remote", "origin", "refs/heads/main").split()[0]

    if head != verified:
        raise RuntimeError("GitHub verification failed. No ZIP generated.")

    temporary = latest.with_name(latest.name + ".partial")

    try:
        git(
            "archive", "--format=zip",
            "--output=" + str(temporary), "HEAD"
        )

        with zipfile.ZipFile(temporary) as archive:
            names = archive.namelist()

            if archive.testzip():
                raise RuntimeError("ZIP integrity failed.")

            if master.name not in names or word.name in names:
                raise RuntimeError("ZIP missing master or contains duplicate Word.")

        os.replace(temporary, latest)

    finally:
        if temporary.exists():
            temporary.unlink()

    print()
    print("=== ONE HANDOVER COMPLETE ===")
    print("Canonical master:", master)
    print("GitHub main verified:", head)
    print("Latest ZIP:", latest)
    print("No duplicate Word handover.")
    print("No backup folders created.")
    print()
    print("Uncommitted work not included in this checkpoint:")
    print(git("status", "--short") or "(none)")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("HANDOVER STOPPED:", error, file=sys.stderr)
        sys.exit(1)