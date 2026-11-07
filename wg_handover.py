from pathlib import Path
from datetime import datetime
import os
import re
import subprocess
import sys
import zipfile

from docx import Document
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "WORLDS_GALLERY_HANDOVER_MASTER.md"
DOCX = ROOT / "WORLDS_GALLERY_FULL_PROJECT_HANDOVER.docx"
SCRIPT = ROOT / "wg_handover.py"
ZIP = ROOT.parent / "WorldsGallery_LATEST_CHECKPOINT.zip"

FILES = [MASTER.name, DOCX.name, SCRIPT.name]
EXPECTED_REMOTE = re.compile(
    r"github\.com[:/]potechto/worlds-gallery(?:\.git)?$",
    re.I,
)

def git(*args):
    result = subprocess.run(
        ["git", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode != 0:
        raise RuntimeError(
            "Git command failed: git " + " ".join(args)
            + "\n" + result.stdout + result.stderr
        )
    return result.stdout.strip()

def add_inline(paragraph, value):
    parts = re.split(r"(\*\*[^*]+\*\*|`[^`]+`)", value)
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part.startswith("`") and part.endswith("`"):
            run = paragraph.add_run(part[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(9)
        else:
            paragraph.add_run(part)

def create_docx(markdown):
    doc = Document()
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)

    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)
    normal.paragraph_format.space_after = Pt(6)

    for name, size, color in [
        ("Title", 19, (22, 58, 63)),
        ("Heading 1", 14, (22, 76, 79)),
        ("Heading 2", 12, (28, 91, 97)),
        ("Heading 3", 11, (32, 91, 93)),
    ]:
        style = doc.styles[name]
        style.font.name = "Aptos Display"
        style.font.size = Pt(size)
        style.font.color.rgb = RGBColor(*color)
        style.font.bold = True
        style.paragraph_format.space_before = Pt(13)
        style.paragraph_format.space_after = Pt(5)
        style.paragraph_format.keep_with_next = True

    doc.core_properties.title = "Worlds Gallery — Full Project Handover"
    doc.core_properties.subject = "Development history, rules, and migration checkpoint"
    doc.core_properties.author = "Worlds Gallery Project"

    in_code = False
    for source_line in markdown.splitlines():
        line = source_line.rstrip()
        stripped = line.strip()

        if stripped.startswith("```"):
            in_code = not in_code
            continue

        if not stripped:
            continue

        if in_code:
            p = doc.add_paragraph(style="No Spacing")
            r = p.add_run(line)
            r.font.name = "Consolas"
            r.font.size = Pt(8.5)
            continue

        heading = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if heading:
            depth = len(heading.group(1))
            if depth == 1:
                p = doc.add_paragraph(style="Title")
                add_inline(p, heading.group(2))
            else:
                p = doc.add_heading(level=min(depth-1, 3))
                add_inline(p, heading.group(2))
            continue

        if stripped.startswith("- "):
            p = doc.add_paragraph(style="List Bullet")
            add_inline(p, stripped[2:])
            continue

        numbered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if numbered:
            p = doc.add_paragraph(style="List Number")
            add_inline(p, numbered.group(1))
            continue

        p = doc.add_paragraph()
        add_inline(p, stripped)

    temp = DOCX.with_name("_wg_handover_working.docx")
    try:
        doc.save(temp)
        check = Document(temp)
        if len(check.paragraphs) < 100:
            raise RuntimeError("Document appears incomplete.")

        with zipfile.ZipFile(temp, "r") as z:
            if z.testzip() is not None:
                raise RuntimeError("DOCX integrity verification failed.")

        os.replace(temp, DOCX)
    finally:
        if temp.exists():
            temp.unlink()

def main():
    if git("branch", "--show-current") != "main":
        raise RuntimeError("STOP: Expected Git branch main.")

    remote = git("remote", "get-url", "origin")
    if not EXPECTED_REMOTE.search(remote):
        raise RuntimeError("STOP: Unexpected GitHub remote: " + remote)

    if not MASTER.is_file():
        raise RuntimeError("STOP: Master handover does not exist.")

    markdown = MASTER.read_text(encoding="utf-8-sig")
    required = [
        "MASTER MIGRATION INSTRUCTION",
        "LOCKED HANDOVER WORKFLOW",
        "SUPABASE PROJECT DETAILS",
        "ACTUAL PHOTO GALLERY",
        "STARTING IN A NEW CHAT",
    ]
    for item in required:
        if item not in markdown:
            raise RuntimeError("STOP: Missing required section: " + item)

    if len(markdown) < 12000:
        raise RuntimeError("STOP: Master summary is unexpectedly short.")

    # Never silently stage unrelated source changes or private files.
    status = git("status", "--porcelain", "--untracked-files=all")
    unexpected = []
    for entry in status.splitlines():
        path = entry[3:].strip().strip('"')
        if path not in FILES:
            unexpected.append(path)

    if unexpected:
        raise RuntimeError(
            "STOP: Unrelated local changes exist. "
            "Review these separately before the handover pipeline:\n"
            + "\n".join(unexpected)
        )

    print("1/5 Generating full DOCX...", flush=True)
    create_docx(markdown)
    print("DOCX created and package structure verified.", flush=True)

    print("2/5 Staging only the handover files...", flush=True)
    git("add", "--", *FILES)

    staged = git("diff", "--cached", "--name-only").splitlines()
    if any(path not in FILES for path in staged):
        raise RuntimeError("STOP: Unexpected staged file.")

    git("diff", "--cached", "--check")

    if staged:
        print("3/5 Creating handover commit...", flush=True)
        message = (
            "Docs: refresh Worlds Gallery full handover "
            + datetime.now().strftime("%Y-%m-%d")
        )
        print(git("commit", "-m", message), flush=True)
    else:
        print("3/5 No handover changes; using current commit.", flush=True)

    print("4/5 Pushing and verifying GitHub...", flush=True)
    print(git("push", "origin", "main"), flush=True)

    local_head = git("rev-parse", "HEAD")
    remote_info = git("ls-remote", "origin", "refs/heads/main")
    remote_head = remote_info.split()[0] if remote_info else ""

    if local_head != remote_head:
        raise RuntimeError("STOP: GitHub HEAD verification failed.")

    if git("status", "--porcelain", "--untracked-files=all"):
        raise RuntimeError("STOP: Unexpected uncommitted changes remain.")

    print("Verified remote HEAD:", local_head, flush=True)

    print("5/5 Creating ZIP in parent ME FILES...", flush=True)
    temporary_zip = ZIP.with_name(ZIP.name + ".partial")

    try:
        git(
            "archive",
            "--format=zip",
            "--output=" + str(temporary_zip),
            "HEAD",
        )

        with zipfile.ZipFile(temporary_zip, "r") as archive:
            corrupt = archive.testzip()
            if corrupt:
                raise RuntimeError("ZIP corruption found: " + corrupt)
            names = set(archive.namelist())
            for filename in FILES:
                if filename not in names:
                    raise RuntimeError("ZIP missing: " + filename)

        os.replace(temporary_zip, ZIP)
    finally:
        if temporary_zip.exists():
            temporary_zip.unlink()

    print()
    print("WORLDS GALLERY HANDOVER PIPELINE: PASS")
    print("DOCX:", DOCX)
    print("ZIP:", ZIP)
    print("GitHub commit:", local_head)
    print("GitHub branch: main, synchronized")
    print("No backup folders created.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("\nHANDOVER PIPELINE STOPPED:", exc, file=sys.stderr)
        sys.exit(1)