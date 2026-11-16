"""Found while proposing add-limits: which grey tells a set-aside municipality apart from every
other colour of the map, also for a viewer with a red-green colour vision deficiency.

Run as `python3 check_set_aside_grey.py` from any directory; standard library only. It measures
as `../map-data/check_colours.py` does (Delta E, OKLab times 100; the simulation of Machado,
Oliveira and Fernandes at severity 1.0, the smaller of protanopia and deuteranopia), whose
functions and colours it loads, against the four classes of each side, the tie and the lakes.
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

OTHERS = {"as many yes as no": colours.NEUTRAL, "lake": colours.LAKE,
          **{f"no, class {k + 1}": c for k, c in enumerate(colours.NO)},
          **{f"yes, class {k + 1}": c for k, c in enumerate(colours.YES)}}


def closest(grey):
    normal = min((colours.delta(grey, c), name) for name, c in OTHERS.items())
    deficient = min((min(colours.delta(grey, c, "protan"), colours.delta(grey, c, "deutan")), name)
                    for name, c in OTHERS.items())
    return normal, deficient


print("Each grey and the closest colour of the map to it:")
for grey in ["#d0d0d0", "#c4c4c4", "#b8b8b8", "#adadad", "#a3a3a3", "#999999", "#8c8c8c",
             "#7a7a7a", "#5a5a5a", "#3c3c3c", "#2c2c2c", "#202020"]:
    (n, n_name), (d, d_name) = closest(grey)
    print(f"  {grey}  normal {n:5.1f} ({n_name})  red-green deficiency {d:5.1f} ({d_name})")
print("Every grey from #202020 to #fcfcfc in steps of 4, with the largest smallest distance:")
ranked = sorted(((min(closest(g)[0][0], closest(g)[1][0]), g)
                 for g in (f"#{v:02x}{v:02x}{v:02x}" for v in range(0x20, 0x100, 4))), reverse=True)
for distance, grey in ranked[:3]:
    print(f"  {grey}  smallest distance {distance:5.1f}")
best_mid = max((min(closest(g)[0][0], closest(g)[1][0]), g)
               for g in (f"#{v:02x}{v:02x}{v:02x}" for v in range(0x80, 0xe0, 4)))
print(f"The best grey from #808080 to #dcdcdc: {best_mid[1]}, smallest distance {best_mid[0]:.1f}")
