"""Found while proposing add-site-style (investigations/site-style.md, 2): what each candidate
font weighs and how it sets the site's text, and whether the site's text needs more than the
font's Latin file.

Run by fonts.sh, which unpacks the packages: `python fonts.py <unpacked packages> <repository>`,
with fontTools and brotli. For each package, from its Latin files of the upright style: their
size in bytes (the variable file, or the files of 400 and 700), whether all ten digits have the
same width, whether the font has the OpenType feature `tnum`, the average width of the 26
lowercase letters in em, and the characters of German, French and Italian it lacks. Then, from
the `unicode-range` of the Latin face in the CSS of Source Sans 3, every character of the data
files and of the texts of the screen that lies outside it.
"""

import glob
import os
import re
import sys

from fontTools.ttLib import TTFont

PACKAGES, REPO = sys.argv[1], sys.argv[2]
NEEDED = "äöüÄÖÜéèêàâçôîïëùûœ«»’–½−"


def latin_files(package):
    files = sorted(glob.glob(os.path.join(package, "package/files/*-latin-wght-normal.woff2")))
    return files or sorted(glob.glob(os.path.join(package, "package/files/*-latin-[47]00-normal.woff2")))


print("Package: bytes of its Latin files; digits of one width; tnum; lowercase width (em); lacking")
for package in sorted(glob.glob(os.path.join(PACKAGES, "*/"))):
    files = latin_files(package)
    font = TTFont(files[0])
    cmap, hmtx = font.getBestCmap(), font["hmtx"]
    widths = {hmtx[cmap[ord(d)]][0] for d in "0123456789"}
    features = {r.FeatureTag for r in font["GSUB"].table.FeatureList.FeatureRecord}
    lowercase = sum(hmtx[cmap[ord(c)]][0] for c in "abcdefghijklmnopqrstuvwxyz") / 26
    lacking = "".join(c for c in NEEDED if ord(c) not in cmap) or "nothing"
    sizes = " + ".join(str(os.path.getsize(f)) for f in files)
    total = sum(os.path.getsize(f) for f in files)
    name = os.path.basename(os.path.normpath(package))
    print(f"  {name}: {sizes} = {total} bytes; {len(widths) == 1}; {'tnum' in features}; "
          f"{lowercase / font['head'].unitsPerEm:.3f}; {lacking}")

css = open(glob.glob(os.path.join(PACKAGES, "*source-sans-3*/package/wght.css"))[0]).read()
face = re.search(r"/\* source-sans-3-latin-wght-normal \*/.*?unicode-range:([^;]+);", css, re.S)
ranges = []
for part in face.group(1).split(","):
    bounds = [int(b, 16) for b in part.strip().removeprefix("U+").split("-")]
    ranges.append((bounds[0], bounds[-1]))

texts = [os.path.join(REPO, "app/static/data/votes.json"),
         os.path.join(REPO, "app/static/data/municipalities.json"),
         os.path.join(REPO, "app/static/data/map.json"),
         *glob.glob(os.path.join(REPO, "app/static/data/votes/*.json")),
         *glob.glob(os.path.join(REPO, "app/src/lib/texts/*.ts"))]
outside = {}
for path in texts:
    with open(path, encoding="utf-8") as f:
        for ch in set(f.read()):
            if not any(a <= ord(ch) <= b for a, b in ranges):
                outside.setdefault(ch, set()).add(os.path.relpath(path, REPO))
print(f"The Latin face of Source Sans 3: {len(ranges)} ranges; {len(texts)} files of text read")
for ch, where in sorted(outside.items()):
    print(f"  U+{ord(ch):04X} {ch!r} in {sorted(where)[:3]}")
print(f"Characters outside it: {len(outside)}")
