"""Found while proposing add-site-style (investigations/site-style.md, 3 and 4): the contrast of
the colours a page could take, on a light and on a dark ground, and how far a dark ground lies
from the map's colours.

Run as `python3 colours.py` from any directory; standard library only. The contrast is WCAG 2.2's
ratio of relative luminances (1.4.3: 4.5:1 for text, 3:1 for large text; 1.4.11: 3:1 for the
parts of a control). The distance between two colours is that of
`../map-data/check_colours.py` (Delta E, OKLab times 100; for a red-green colour vision
deficiency the smaller of protanopia and deuteranopia), whose functions and colours it loads.
"""

import contextlib
import importlib.util
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location(
    "check_colours", os.path.join(HERE, "..", "map-data", "check_colours.py"))
colours = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()):  # it prints its own report when loaded
    spec.loader.exec_module(colours)

MAP = {"as many yes as no": colours.NEUTRAL, "lake": colours.LAKE,
       **{f"no, class {k + 1}": c for k, c in enumerate(colours.NO)},
       **{f"yes, class {k + 1}": c for k, c in enumerate(colours.YES)}}
SET_ASIDE = "#2c2c2c"


def luminance(colour):
    r, g, b = colours.linear(colour)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    high, low = sorted((luminance(a), luminance(b)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def deficient(a, b):
    return min(colours.delta(a, b, "protan"), colours.delta(a, b, "deutan"))


PALETTES = {
    "light": ("#ffffff", {"text": "#1c1c1c", "secondary text": "#595959", "link and focus": "#1a5fb4",
                          "greyed": "#767676", "yes": "#007260", "no": "#934319",
                          "borders of controls": "#767676", "hatching's lines": "#999999"}),
    "dark": ("#121212", {"text": "#e8e8e8", "secondary text": "#b0b0b0", "link and focus": "#8ab4f8",
                         "greyed": "#9a9a9a", "yes": "#4bc1ad", "no": "#e5946f",
                         "borders of controls": "#9a9a9a", "hatching's lines": "#999999"}),
}
for scheme, (ground, palette) in PALETTES.items():
    print(f"The {scheme} palette on {ground}:")
    for role, colour in palette.items():
        print(f"  {role:<20} {colour}  {contrast(colour, ground):5.2f}:1")

print("Considered and not taken, on #ffffff:")
for role, colour in {"browser's link": "#0000ee", "red of the flag": "#d52b1e", "deep red": "#c8102e",
                     "yes, class 3": "#009c86", "no, class 3": "#c2673b"}.items():
    print(f"  {role:<20} {colour}  {contrast(colour, '#ffffff'):5.2f}:1")
print("The light palette's greys on an off-white ground, #f5f5f2:")
for colour in ["#1c1c1c", "#595959", "#767676", "#1a5fb4"]:
    print(f"  {colour}  {contrast(colour, '#f5f5f2'):5.2f}:1")
print("On #1c1c1c, a softer dark ground:")
for role, colour in {"yes, class 4": "#007260", "no, class 4": "#934319", "greyed of light": "#767676",
                     "yes, class 2": "#4bc1ad", "no, class 2": "#e5946f", "greyed": "#9a9a9a"}.items():
    print(f"  {role:<20} {colour}  {contrast(colour, '#1c1c1c'):5.2f}:1")

print(f"The set-aside grey {SET_ASIDE} and a dark ground (Delta E, normal / red-green deficiency):")
for ground in ["#000000", "#0d0d0d", "#121212", "#161616", "#1c1c1c", "#202020"]:
    print(f"  {ground}  {colours.delta(SET_ASIDE, ground):5.1f} / {deficient(SET_ASIDE, ground):5.1f}")
print("Each dark ground and the closest colour of the map's classes, tie and lakes:")
for ground in ["#000000", "#121212", "#1c1c1c"]:
    normal = min((colours.delta(ground, c), name) for name, c in MAP.items())
    other = min((deficient(ground, c), name) for name, c in MAP.items())
    print(f"  {ground}  normal {normal[0]:5.1f} ({normal[1]})  red-green deficiency "
          f"{other[0]:5.1f} ({other[1]})")
