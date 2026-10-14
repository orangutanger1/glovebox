"""Grade the Seedance mood loops back to the stills' colours and export GIFs.

Seedance renders every frame of a clip with near-constant colour drift (a
warmer, darker page, a deeper body blue). Each channel is remapped by one
piecewise-linear curve per mood, drawn through anchor colours measured with the
same masks in the still (`in/<mood>.png`) and in the clip (median over every
frame but the first): the tyres and outlines, the body, the glass, the
contact shadow and the page, plus black and white at the ends. Per channel, so
hues cannot cross; a curve through a handful of points, so it cannot invent
texture. Pixels that are neutral grey in the clip skip the curves and stay grey.

Tried and dropped, for the record: a two-anchor per-channel line tinted the
tyres and shadow blue; a quantile curve turned compression noise into a
watercolour mottle; 3x4 matrices (whole-frame or on these anchors) overfit and
either washed the car out or swung it yellow.

Pixels that land near the page are then snapped to #F4F4F7 exactly, and the
loop is quantized undithered to one palette, so the GIF's background meets the
arm-A canvas without a seam.

Usage: python3 grade.py <out_dir> [page_hex]   (reads ./<mood>.mp4 and ./in/<mood>.png)
page_hex defaults to F4F4F7 (arm A); A v2's warm page is F6F3EE.
"""
import glob
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

PAGE = np.array([244, 244, 247], float)
# The tyres' navy in the stills. Fixed rather than measured: the "dark" mask
# also takes in pupils and mouths, whose share differs between a still and its
# clip (the worried eyes are big), and a measured anchor turned tyres brown.
INK = np.array([38, 40, 56], float)
MOODS = ["happy", "heads-up", "worried", "sleepy", "celebrating"]
SIZE, FPS = 432, 12
# The clips frame the car at half width so a jump or a sparkle has room; the
# app's PNGs frame it at about 0.63. Cropping the 960px source to this box
# (x, y, side) before scaling puts the GIF car at the PNGs' scale, so a mood
# can swap between still and loop in the same box.
CROP = (140, 120, 680)


def masks(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    sat = b - r
    return {
        "body": (sat > 90) & (lum < 150),
        "glass": (sat > 15) & (sat < 70) & (lum > 150) & (lum < 225),
        "dark": lum < 60,
        "shadow": (np.abs(sat) < 14) & (lum > 140) & (lum < 218),
    }


def anchors(a):
    border = np.concatenate([a[:10].reshape(-1, 3), a[-10:].reshape(-1, 3)])
    out = {"page": np.median(border, 0)}
    for k, m in masks(a).items():
        if m.sum() > 30:
            out[k] = np.median(a[m], 0)
    return out


def curves(frames, ref):
    want = anchors(ref)
    want["page"] = PAGE
    want["dark"] = INK
    per = [anchors(f) for f in frames[1:]]
    keys = [k for k in want if sum(k in p for p in per) > len(per) // 2]
    have = {k: np.median([p[k] for p in per if k in p], 0) for k in keys}
    out = []
    for c in range(3):
        pts = sorted([(0.0, 0.0), (255.0, 255.0)] + [(have[k][c], want[k][c]) for k in keys])
        xs, ys = [], []
        for x, y in pts:  # drop anchors too close to tell apart in this channel
            if xs and x - xs[-1] < 3:
                continue
            xs.append(x)
            ys.append(y)
        out.append((np.array(xs), np.array(ys)))
    return out, keys


def lum(a):
    return 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]


def apply(a, cs, ramp):
    out = np.stack([np.interp(a[..., c], *cs[c]) for c in range(3)], 2)
    # Grey stays grey: the blue channel's curve has to lift the body a lot, and
    # it would lift the neutral tyres, contact shadow and eye whites with it.
    # Pixels that are neutral in the clip instead take their colour from a ramp
    # by lightness alone: the still's tyre navy at the clip's tyre lightness,
    # the page at the page's, extrapolated past it for the eye whites.
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spread = a.max(2) - a.min(2)
    # Dark pixels count as neutral with more spread: the model warms the tyres
    # toward brown, which reads wrong next to the still's navy.
    neutral = ((spread < 18) | ((spread < 34) & (lum(a) < 80) & (b - r < 20))) & (lum(a) > 15)
    (l0, c0), (l1, c1) = ramp
    t = ((lum(a)[neutral] - l0) / (l1 - l0))[:, None]
    out[neutral] = np.clip(c0 + t * (c1 - c0), 0, 255)
    # Light greys above the contact shadow are the model's landing dust, which
    # on a car reads as exhaust smoke; they go back to the page.
    rows = np.arange(a.shape[0])[:, None] < 0.8 * a.shape[0]
    out[neutral & rows & (lum(a) > 0.86 * l1) & (lum(a) < 0.99 * l1)] = PAGE
    return out


def close_loop(frames, min_len=40):
    """Cut the loop where it meets itself best.

    The request asks for the same first and last frame, and most clips land
    within a couple of levels; the ones that do not (a squint held, the car a
    few pixels lower) would jump once a loop, and a crossfade there ghosts two
    cars. So the loop runs from frame i to frame j-1 for the pair i < j, at
    least min_len apart, whose frames differ least.
    """
    a = [np.asarray(f, float)[::4, ::4] for f in frames]
    n = len(a)
    best = (np.abs(a[0] - a[-1]).mean(), 0, n)
    for i in range(0, n - min_len):
        for j in range(i + min_len, n):
            d = np.abs(a[i] - a[j]).mean()
            if d < best[0]:
                best = (d, i, j)
    _, i, j = best
    return frames[i:j]


def stabilize(frames, tol=12):
    """Hold a pixel's palette index until its colour really changes.

    Compression noise makes still areas flip between neighbouring palette
    entries every frame — a shimmer you can see, and changes the GIF has to
    store. Holding the previous index when the new colour is within `tol`
    keeps still areas still, so each frame stores only what moved.
    """
    pal = np.array(frames[0].getpalette()[: 256 * 3]).reshape(-1, 3).astype(int)
    prev = np.array(frames[0])
    out = [frames[0]]
    for f in frames[1:]:
        cur = np.array(f)
        # The page always wins, or a moving car leaves a faint outline behind.
        page = (np.abs(pal[cur] - PAGE.astype(int)).max(2) == 0)
        same = (np.abs(pal[cur] - pal[prev]).max(2) <= tol) & ~page
        cur = np.where(same, prev, cur).astype(np.uint8)
        im = Image.fromarray(cur, "P")
        im.putpalette(frames[0].getpalette())
        out.append(im)
        prev = cur
    return out


def main(out_dir, page_hex="F4F4F7"):
    global PAGE
    PAGE = np.array([int(page_hex[i:i + 2], 16) for i in (0, 2, 4)], float)
    for mood in MOODS:
        tmp = tempfile.mkdtemp()
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", f"{mood}.mp4", "-vf",
             f"fps={FPS},crop={CROP[2]}:{CROP[2]}:{CROP[0]}:{CROP[1]},scale={SIZE}:{SIZE}:flags=lanczos", f"{tmp}/f%03d.png"],
            check=True,
        )
        frames = [np.array(Image.open(f).convert("RGB")).astype(float) for f in sorted(glob.glob(f"{tmp}/f*.png"))]
        k = 1024 / 960  # the stills are 1024px, the clips 960px
        box = tuple(round(v * k) for v in (CROP[0], CROP[1], CROP[0] + CROP[2], CROP[1] + CROP[2]))
        ref = np.array(Image.open(f"in/{mood}.png").convert("RGB").crop(box).resize((SIZE, SIZE), Image.LANCZOS)).astype(float)
        cs, keys = curves(frames, ref)
        have = [anchors(f) for f in frames[1:]]
        dark_src = np.median([h["dark"] for h in have if "dark" in h], 0)
        page_src = np.median([h["page"] for h in have], 0)
        ramp = ((lum(dark_src), INK), (lum(page_src), PAGE))
        graded = []
        # Frame 0 is the still with only part of the drift applied; graded
        # with the rest it comes out pale, and the loop would flash on it.
        for a in frames[1:]:
            b = apply(a, cs, ramp)
            b[np.abs(b - PAGE).max(axis=2) < 10] = PAGE
            graded.append(Image.fromarray(b.astype(np.uint8)))
        graded = close_loop(graded)
        pal = graded[len(graded) // 2].quantize(colors=128, method=Image.Quantize.MEDIANCUT)
        q = stabilize([g.quantize(palette=pal, dither=Image.Dither.NONE) for g in graded])
        path = os.path.join(out_dir, f"car-{mood}.gif")
        q[0].save(path, save_all=True, append_images=q[1:], duration=round(1000 / FPS), loop=0, optimize=True, disposal=1)
        print(mood, len(q), "frames", os.path.getsize(path) // 1024, "KB", "anchors:", ",".join(keys))


if __name__ == "__main__":
    main(*sys.argv[1:])
