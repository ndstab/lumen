#!/usr/bin/env python3
"""
Generates the lesson videos.

The videos are built from the lesson content already in the database, so the
film for a lesson always says what that lesson says. Each one is a sequence of
slides in the Lumen palette with a running progress bar and timecode, which is
what makes seeking visibly work when you drag the scrubber.

Requires Pillow and ffmpeg, both of which are checked at startup.

    python3 scripts/make_videos.py            build anything missing
    python3 scripts/make_videos.py --force    rebuild everything
"""

import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow is required. Install it with: python3 -m pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "app.db"
OUT = ROOT / "public" / "media"

W, H = 1280, 720
FPS = 10

# The Riso Press palette, converted from the OKLCH tokens in globals.css.
PAPER = (247, 242, 226)
PAPER_2 = (237, 230, 207)
INK = (30, 35, 64)
INK_2 = (96, 103, 134)
BLUE = (46, 91, 212)
ORANGE = (232, 118, 60)

FONT_DIR = Path("/System/Library/Fonts/Supplemental")
FONTS = {
    "black": FONT_DIR / "Arial Black.ttf",
    "bold": FONT_DIR / "Arial Bold.ttf",
    "regular": FONT_DIR / "Arial.ttf",
}


def font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONTS[kind]
    if not path.exists():
        return ImageFont.load_default(size)
    return ImageFont.truetype(str(path), size)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=f) <= max_w or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def clock(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m}:{s:02d}"


def first_sentence(text: str, limit: int = 150) -> str:
    for stop in (". ", "; "):
        if stop in text:
            candidate = text.split(stop)[0] + "."
            if len(candidate) <= limit:
                return candidate
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + "..."


def build_beats(course_title: str, lesson_title: str, video_title: str, blocks) -> list[dict]:
    """Turn the lesson body into a small sequence of slides."""
    beats = [{"kind": "title", "head": video_title, "sub": f"{course_title}  ·  {lesson_title}"}]

    for kind, content, _caption in blocks:
        if kind == "heading":
            beats.append({"kind": "heading", "head": content})
        elif kind == "callout":
            beats.append({"kind": "callout", "head": first_sentence(content)})
        elif kind == "list":
            try:
                items = json.loads(content)
            except (json.JSONDecodeError, TypeError):
                continue
            for item in items[:3]:
                beats.append({"kind": "point", "head": first_sentence(item)})
        elif kind == "paragraph" and len(beats) < 3:
            beats.append({"kind": "point", "head": first_sentence(content)})

    beats.append({"kind": "outro", "head": "Now try the questions", "sub": lesson_title})
    return beats[:9]


def draw_chrome(img: Image.Image, course_title: str, lesson_no: int) -> None:
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 74], fill=PAPER)
    d.line([(0, 74), (W, 74)], fill=INK, width=3)

    d.rectangle([48, 26, 74, 52], fill=BLUE)
    d.rectangle([52, 30, 78, 56], outline=INK, width=2)
    d.text((94, 28), "Lumen", font=font("black", 26), fill=INK)

    label = f"{course_title}   Lesson {lesson_no}"
    f = font("bold", 20)
    d.text((W - 48 - d.textlength(label, font=f), 32), label, font=f, fill=INK_2)


def draw_slide(beat: dict, course_title: str, lesson_no: int) -> Image.Image:
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    draw_chrome(img, course_title, lesson_no)

    left, right = 96, W - 96
    max_w = right - left

    if beat["kind"] == "title":
        f = font("black", 68)
        lines = wrap(d, beat["head"], f, max_w)
        y = 250 - (len(lines) - 1) * 40
        # hard offset shadow, the same device the site uses
        for line in lines:
            d.text((left + 6, y + 6), line, font=f, fill=ORANGE)
            d.text((left, y), line, font=f, fill=INK)
            y += 82
        d.line([(left, y + 24), (left + 220, y + 24)], fill=BLUE, width=8)
        d.text((left, y + 56), beat["sub"], font=font("bold", 26), fill=INK_2)

    elif beat["kind"] == "outro":
        f = font("black", 60)
        d.rectangle([left, 210, right, 430], fill=BLUE)
        d.rectangle([left + 8, 218, right + 8, 438], outline=INK, width=3)
        d.rectangle([left, 210, right, 430], fill=BLUE, outline=INK, width=3)
        lines = wrap(d, beat["head"], f, max_w - 80)
        y = 268
        for line in lines:
            d.text((left + 40, y), line, font=f, fill=PAPER)
            y += 72
        d.text((left, 470), beat["sub"], font=font("bold", 26), fill=INK_2)

    else:
        is_callout = beat["kind"] == "callout"
        is_heading = beat["kind"] == "heading"
        size = 54 if is_heading else 42
        f = font("black" if is_heading else "bold", size)
        lines = wrap(d, beat["head"], f, max_w - 70)

        block_h = len(lines) * (size + 18) + 72
        top = max(140, (H - 120 - block_h) // 2 + 40)

        accent = ORANGE if is_callout else BLUE
        d.rectangle([left, top, left + 16, top + block_h], fill=accent)
        if is_callout:
            d.rectangle([left + 16, top, right, top + block_h], fill=PAPER_2)

        y = top + 36
        for line in lines:
            d.text((left + 54, y), line, font=f, fill=INK)
            y += size + 18

    return img


def draw_footer(img: Image.Image, elapsed: float, total: float, beat_no: int, beats: int) -> None:
    """
    Timecode and slide counter only.

    Deliberately no progress bar: the player supplies a real scrubber directly
    below the frame, and a second bar inside the picture just reads as a
    duplicate control.
    """
    d = ImageDraw.Draw(img)
    d.rectangle([0, H - 72, W, H], fill=PAPER)
    d.line([(0, H - 72), (W, H - 72)], fill=INK, width=3)

    x0, x1 = 96, W - 96
    f = font("bold", 22)
    d.text((x0, H - 50), f"{clock(elapsed)} / {clock(total)}", font=f, fill=INK_2)

    # A small square per slide, filled up to the current one.
    size, gap = 14, 8
    total_w = beats * size + (beats - 1) * gap
    sx = x1 - total_w
    for i in range(beats):
        box = [sx + i * (size + gap), H - 48, sx + i * (size + gap) + size, H - 34]
        d.rectangle(box, fill=ORANGE if i < beat_no else PAPER_2, outline=INK, width=2)


def render(lesson, force: bool) -> bool:
    course_slug, course_title, position, title, video_title, duration, blocks = lesson
    out_path = OUT / f"{course_slug}-{position + 1}.mp4"

    if out_path.exists() and not force:
        print(f"  skip  {out_path.name} (already built)")
        return False

    beats = build_beats(course_title, title, video_title, blocks)
    per_beat = duration / len(beats)
    total_frames = int(duration * FPS)

    tmp = Path(tempfile.mkdtemp(prefix="lumen-frames-"))
    try:
        cache: dict[int, Image.Image] = {}
        for n in range(total_frames):
            t = n / FPS
            idx = min(len(beats) - 1, int(t / per_beat))
            if idx not in cache:
                cache[idx] = draw_slide(beats[idx], course_title, position + 1)
            frame = cache[idx].copy()
            draw_footer(frame, t, duration, idx + 1, len(beats))
            frame.save(tmp / f"{n:05d}.png", compress_level=1)

        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-framerate", str(FPS),
                "-i", str(tmp / "%05d.png"),
                "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                "-shortest",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
                "-pix_fmt", "yuv420p", "-r", "24",
                "-movflags", "+faststart",
                "-c:a", "aac", "-b:a", "48k",
                str(out_path),
            ],
            check=True,
        )
        size_mb = out_path.stat().st_size / 1e6
        print(f"  built {out_path.name}  {clock(duration)}  {size_mb:.1f} MB  {len(beats)} slides")
        return True
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main() -> None:
    if not DB.exists():
        sys.exit("No database. Run: npm run seed")
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is required and was not found on PATH.")

    force = "--force" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)

    con = sqlite3.connect(DB)
    rows = con.execute(
        """SELECT c.slug, c.title, l.position, l.title, l.video_title,
                  l.video_duration_s, l.id
             FROM lessons l JOIN courses c ON c.id = l.course_id
            ORDER BY c.position, l.position"""
    ).fetchall()

    print(f"Building {len(rows)} lesson videos into {OUT.relative_to(ROOT)}")
    built = 0
    for slug, ctitle, pos, title, vtitle, duration, lesson_id in rows:
        blocks = con.execute(
            "SELECT kind, content, caption FROM lesson_blocks WHERE lesson_id = ? ORDER BY position",
            (lesson_id,),
        ).fetchall()
        if render((slug, ctitle, pos, title, vtitle, duration, blocks), force):
            built += 1
    con.close()
    print(f"Done. {built} built, {len(rows) - built} already present.")


if __name__ == "__main__":
    main()
