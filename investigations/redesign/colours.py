"""Found while proposing redesign-site (investigations/redesign.md, 5): the contrast of the
colours the redesign adds, on a light and on a dark ground, and how far the two sides of a bar
lie from each other.

Run as `python3 colours.py` from any directory; standard library only. The contrast is WCAG 2.2's
ratio of relative luminances (1.4.3: 4.5:1 for text; 1.4.11: 3:1 for the parts of a control and of
a graphic). The distance between two colours is that of `../map-data/check_colours.py` (Delta E,
OKLab times 100; for a red-green colour vision deficiency the smaller of protanopia and
deuteranopia), whose functions it loads.
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


def luminance(colour):
    r, g, b = colours.linear(colour)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    high, low = sorted((luminance(a), luminance(b)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def deficient(a, b):
    return min(colours.delta(a, b, "protan"), colours.delta(a, b, "deutan"))


SCHEMES = {
    "light": {
        "ground": "#ffffff", "surface": "#f4f4f4",
        "text": "#1c1c1c", "secondary": "#595959", "greyed": "#767676", "greyed, darker": "#6e6e6e",
        "yes word": "#007260", "no word": "#934319",
        "yes bar": "#009c86", "no bar": "#c2673b",
        "control border": "#767676", "bins outside": "#8c8c8c", "empty track": "#e4e4e4",
        "hairline": "#dedede",
    },
    "dark": {
        "ground": "#121212", "surface": "#1c1c1c",
        "text": "#e8e8e8", "secondary": "#b0b0b0", "greyed": "#9a9a9a", "greyed, darker": "#9a9a9a",
        "yes word": "#4bc1ad", "no word": "#e5946f",
        "yes bar": "#4bc1ad", "no bar": "#e5946f",
        "control border": "#9a9a9a", "bins outside": "#6e6e6e", "empty track": "#303030",
        "hairline": "#333333",
    },
}

for name, c in SCHEMES.items():
    print(f"The {name} scheme:")
    print("  Text, at least 4.5:1:")
    for role in ("text", "secondary", "greyed", "greyed, darker", "yes word", "no word"):
        print(f"    {role:<15} {c[role]}  on the ground {contrast(c[role], c['ground']):5.2f}:1"
              f"  on the surface {contrast(c[role], c['surface']):5.2f}:1")
    print("  Links, controls and the ring of focus in the text's colour, at least 3:1:")
    print(f"    {'text':<15} {c['text']}  on the ground {contrast(c['text'], c['ground']):5.2f}:1")
    print("  Parts of a drawing, at least 3:1 on the ground:")
    for role in ("yes bar", "no bar", "control border", "bins outside", "empty track", "hairline"):
        print(f"    {role:<15} {c[role]}  {contrast(c[role], c['ground']):5.2f}:1")
    print("  Told apart:")
    print(f"    bins inside and outside: {contrast(c['text'], c['bins outside']):5.2f}:1")
    print(f"    the two sides of a bar: distance {colours.delta(c['yes bar'], c['no bar']):5.1f}, "
          f"red-green deficiency {deficient(c['yes bar'], c['no bar']):5.1f}; "
          f"contrast {contrast(c['yes bar'], c['no bar']):4.2f}:1")
    print(f"    the surface and the ground: distance {colours.delta(c['surface'], c['ground']):4.1f}")
    print(f"    the set-aside grey #2c2c2c and the surface: distance "
          f"{colours.delta('#2c2c2c', c['surface']):4.1f}")
