"""Found while proposing add-result-map: how far apart the colours of the map are.

Run as `python3 check_colours.py`; standard library only, no download. The distance between two
colours is the Euclidean distance in OKLab, times 100 (Delta E). For a viewer with a red-green
colour vision deficiency, both colours are first transformed by the simulation of Machado,
Oliveira and Fernandes (2009) at severity 1.0, in linear RGB, for protanopia and deuteranopia;
the smaller distance is printed. Delta E of 8 or more tells two colours apart, 6 to 8 only with
a second cue (a label, a pattern); below 15 under normal vision two neighbours are hard to tell.
"""

import math

# The colours of the map: the classes of the side that won, from the closest to the clearest.
NO = ["#fbbea3", "#e5946f", "#c2673b", "#934319"]
YES = ["#92dfd0", "#4bc1ad", "#009c86", "#007260"]
NEUTRAL = "#f0efec"  # as many yes as no votes
LAKE = "#9fb8e8"
# For comparison: the four darkest steps of ColorBrewer's "Reds" and "Greens".
CLASSIC_NO = ["#fcae91", "#fb6a4a", "#de2d26", "#a50f15"]
CLASSIC_YES = ["#c7e9c0", "#74c476", "#31a354", "#006d2c"]

MACHADO = {
    "protan": ((0.152286, 1.052583, -0.204868), (0.114503, 0.786281, 0.099216),
               (-0.003882, -0.048116, 1.051998)),
    "deutan": ((0.367322, 0.860646, -0.227968), (0.280085, 0.672501, 0.047413),
               (-0.011820, 0.042940, 0.968881)),
}


def linear(colour):
    channels = (int(colour[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]


def oklab(rgb):
    r, g, b = rgb
    l = math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m = math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s = math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def simulate(rgb, kind):
    return [min(1.0, max(0.0, sum(row[i] * rgb[i] for i in range(3)))) for row in MACHADO[kind]]


def delta(a, b, kind=None):
    ra, rb = linear(a), linear(b)
    if kind:
        ra, rb = simulate(ra, kind), simulate(rb, kind)
    return 100 * math.dist(oklab(ra), oklab(rb))


def report(label, a, b):
    deficient = min(delta(a, b, "protan"), delta(a, b, "deutan"))
    print(f"{label:<34} {a} {b}  normal {delta(a, b):5.1f}  red-green deficiency {deficient:5.1f}")


print("The same class of yes and of no (50-60%, 60-70%, 70-80%, 80% or more):")
for k, (no, yes) in enumerate(zip(NO, YES)):
    report(f"  map, class {k + 1}", no, yes)
for k, (no, yes) in enumerate(zip(CLASSIC_NO, CLASSIC_YES)):
    report(f"  ColorBrewer Reds/Greens, class {k + 1}", no, yes)
print("Neighbouring classes on one side:")
for side, colours in (("no", NO), ("yes", YES)):
    for k in range(3):
        report(f"  {side}, classes {k + 1} and {k + 2}", colours[k], colours[k + 1])
print("The neutral colour and the lakes against the classes:")
for other in (NO[0], YES[0]):
    report("  as many yes as no", NEUTRAL, other)
for other in (NO[0], NO[1], YES[0], YES[1], NEUTRAL):
    report("  lake", LAKE, other)
