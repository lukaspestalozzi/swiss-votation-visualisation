"""Found while proposing add-result-map: the boundaries, the cantons and the lakes of the map.

Run as `uv run --no-project --with pyshp==3.1.6 python check_map_sources.py <data directory>`.
It reads two BFS sources: the register of municipalities, which gives the boundaries of a date,
and the ThemaKart set 2026, which holds the same boundaries with the cantons and the lakes. It
compares both with the register's list of municipalities of 2026-01-01.
"""

import csv
import gzip
import io
import json
import math
import os
import sys
import urllib.error
import urllib.request
import zipfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data-sources"))

import shapefile  # noqa: E402  (pyshp, given by `uv run --with`)

from sources import REGISTER, data_dir, fetch  # noqa: E402

# The register's boundaries of a date (dd-mm-yyyy): Commune, District, Canton or Country; K4
# (generalised for 1:500,000 to 1:5 million) or G1 (for 1:300,000 to 1:600,000).
BOUNDARIES = ("https://www.agvchapp.bfs.admin.ch/api/boundaries/divisions?division={division}"
              "&resolution={resolution}&dissolve=true&date={date}&format={format}")
# The BFS asset store: an asset by its order number, and an asset's file.
ASSETS = "https://dam-api.bfs.admin.ch/hub/api/dam/assets?orderNr={order}&language=de"
MASTER = "https://dam-api.bfs.admin.ch/hub/api/dam/assets/{asset}/master"
SET_2026 = "mb-x-00.07.01.01-26"  # Kartengeometrien ThemaKart - Set 2026
LAYERS = {
    "municipalities": "K4polg20260101gf_ch2007Poly",
    "cantons": "K4kant20260101gf_ch2007Poly",
    "lakes 1": "k4seenyyyymmdd11_ch2007Poly",
    "lakes 2": "k4seenyyyymmdd22_ch2007Poly",
    "voting": "K4_voge20260101gf_Poly_ch2007",
}

data = data_dir()
path = lambda name: os.path.join(data, name)
is_zip = lambda content: zipfile.ZipFile(io.BytesIO(content)).testzip()


def shapes(archive, stem):
    """The records and shapes of one layer of a zipped shapefile, found by its file name."""
    with zipfile.ZipFile(archive) as z:
        names = {n.rsplit(".", 1)[0].rsplit("/", 1)[-1]: n.rsplit(".", 1)[0] for n in z.namelist()}
        base = names[stem]
        reader = shapefile.Reader(shp=io.BytesIO(z.read(base + ".shp")),
                                  dbf=io.BytesIO(z.read(base + ".dbf")),
                                  shx=io.BytesIO(z.read(base + ".shx")), encoding="utf-8")
        prj = z.read(base + ".prj").decode()[:40]
        return list(zip(reader.records(), reader.shapes())), prj


def points(shape):
    return len(shape.points)


fetch(REGISTER.format(date="01-01-2026"), path("register_2026-01-01.csv"),
      is_complete=lambda content: content.decode("utf-8-sig"))
with open(path("register_2026-01-01.csv"), encoding="utf-8-sig") as file:
    listed = {int(row["BfsCode"]) for row in csv.DictReader(file) if row["Level"] == "3"}
print(f"register list of 2026-01-01: {len(listed)} municipalities")

# The register's boundaries.
fetch(BOUNDARIES.format(division="Commune", resolution="K4", date="01-01-2026", format="shp"),
      path("boundaries_commune_k4_2026-01-01.zip"), is_complete=is_zip)
fetch(BOUNDARIES.format(division="Canton", resolution="K4", date="01-01-2026", format="shp"),
      path("boundaries_canton_k4_2026-01-01.zip"), is_complete=is_zip)
fetch(BOUNDARIES.format(division="Country", resolution="K4", date="01-01-2026", format="shp"),
      path("boundaries_country_k4_2026-01-01.zip"), is_complete=is_zip)
fetch(BOUNDARIES.format(division="Commune", resolution="G1", date="01-01-2026", format="geojson"),
      path("boundaries_commune_g1_2026-01-01.geojson"))
communes, prj = shapes(path("boundaries_commune_k4_2026-01-01.zip"), "Boundaries_K4_Commune_20260101")
fields = list(communes[0][0].as_dict())
numbers = [record["GDENR"] for record, _ in communes]
print(f"register boundaries K4 Commune 2026-01-01: {len(communes)} shapes, fields {fields}, {prj}")
print(f"  numbers: {len(set(numbers))} different; not on the list: {sorted(set(numbers) - listed)};"
      f" of the list without a shape: {sorted(listed - set(numbers))}")
print(f"  points: {sum(points(s) for _, s in communes)}")
cantons, _ = shapes(path("boundaries_canton_k4_2026-01-01.zip"), "Boundaries_K4_Canton_20260101")
print(f"register boundaries K4 Canton 2026-01-01: {len(cantons)} shapes,"
      f" {sorted(r['KTKZ'] for r, _ in cantons)}")
with open(path("boundaries_commune_g1_2026-01-01.geojson"), encoding="utf-8") as file:
    g1 = json.load(file)["features"]
g1_numbers = {f["properties"]["GDENR"]: f["properties"]["GDENAME"] for f in g1}
print(f"register boundaries G1 Commune 2026-01-01: {len(g1)} shapes; not on the list:"
      f" {sorted((n, name) for n, name in g1_numbers.items() if n not in listed)}")
try:
    urllib.request.urlopen(BOUNDARIES.format(division="Commune", resolution="K4",
                                             date="01-01-2027", format="geojson"), timeout=60)
    print("register boundaries of 2027-01-01: given")
except urllib.error.HTTPError as error:
    print(f"register boundaries of 2027-01-01: HTTP {error.code},"
          f" {json.loads(error.read()).get('errors')}")

# The ThemaKart set 2026.
fetch(ASSETS.format(order=SET_2026), path("themakart_set_2026_asset.json"))
with open(path("themakart_set_2026_asset.json"), encoding="utf-8") as file:
    asset = json.load(file)["data"][0]
terms = asset["description"]["categorization"]["termsOfUse"][0]
print(f"ThemaKart set 2026: asset {asset['ids']['damId']},"
      f" '{asset['description']['titles']['main']}', published {asset['bfs']['embargo']},"
      f" terms {terms['code']} ({terms['name']})")
fetch(MASTER.format(asset=asset["ids"]["damId"]), path("themakart_set_2026.zip"), is_complete=is_zip)
layers = {name: shapes(path("themakart_set_2026.zip"), stem)
          for name, stem in LAYERS.items()}
for name, (rows, prj) in layers.items():
    print(f"  {name}: {len(rows)} shapes, {sum(points(s) for _, s in rows)} points, {prj}")
themakart = {record["id"]: shape for record, shape in layers["municipalities"][0]}
print(f"  municipalities: not on the list: {sorted(set(themakart) - listed)};"
      f" of the list without a shape: {sorted(listed - set(themakart))}")
register_shapes = {record["GDENR"]: shape for record, shape in communes}
same = [n for n in listed
        if len(register_shapes[n].points) == len(themakart[n].points)
        and max(max(abs(a[0] - b[0]), abs(a[1] - b[1]))
                for a, b in zip(register_shapes[n].points, themakart[n].points)) < 1]
print(f"  municipalities with the same points as the register's, within 1 m: {len(same)}"
      f" of {len(listed)}")


def nearest(point, ring_points):
    return min(math.hypot(point[0] - x, point[1] - y) for x, y in ring_points)


# Per municipality: how far the register's corner farthest from ThemaKart's outline lies from
# ThemaKart's nearest corner.
offsets = sorted((max(nearest(p, themakart[n].points) for p in register_shapes[n].points), n)
                 for n in listed)
for share in (0.5, 0.9):
    print(f"  largest offset of a corner, {share:.0%} of the municipalities within:"
          f" {offsets[int(share * len(offsets)) - 1][0]:.1f} m")
print(f"  largest offsets: {[(n, round(d)) for d, n in offsets[-3:]]}")
lakes = sorted(r["name"] for r, _ in layers["lakes 1"][0] + layers["lakes 2"][0])
print(f"  lakes: {len(lakes)}: {', '.join(lakes)}")


def rings(shape):
    parts = list(shape.parts) + [len(shape.points)]
    return [shape.points[a:b] for a, b in zip(parts, parts[1:])]


def inside(point, all_rings):
    x, y, crossings = point[0], point[1], False
    for ring in all_rings:
        for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
            if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
                crossings = not crossings
    return crossings


def signed_area(ring):
    """Negative for an outer ring, positive for a hole: shapefiles run outer rings clockwise."""
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1])) / 2


# The lakes are holes: in the municipalities, the cantons and the country, of both sources.
country, _ = shapes(path("boundaries_country_k4_2026-01-01.zip"), "Boundaries_K4_Country_20260101")
country_rings = rings(country[0][1])
outer = [ring for ring in country_rings if signed_area(ring) < 0]
holes = [ring for ring in country_rings if signed_area(ring) > 0]
print(f"register boundaries K4 Country 2026-01-01: {len(outer)} outer rings and {len(holes)} holes"
      f" of {sum(signed_area(ring) for ring in holes) / 1e6:.0f} km²")
lake_shapes = [(r["name"], s) for r, s in layers["lakes 1"][0] + layers["lakes 2"][0]]
IN_LAKES = {"Zugersee": (2679356, 1218905), "Zürichsee": (2702388, 1232337),
            "Lac de Neuchâtel": (2554282, 1194057), "Lac Léman": (2530000, 1145000),
            "Bodensee": (2745000, 1275000)}
for lake, point in IN_LAKES.items():
    print(f"  a point in the {lake} {point}: in a ThemaKart lake"
          f" {any(inside(point, rings(s)) for _, s in lake_shapes)};"
          f" in a register municipality {any(inside(point, rings(s)) for _, s in communes)};"
          f" in a ThemaKart municipality {any(inside(point, rings(s)) for s in themakart.values())};"
          f" inside the country's outer rings {inside(point, outer)}")
outer_points = [q for ring in outer for q in ring]
outside = [(nearest(p, outer_points), name)
           for name, shape in lake_shapes for p in shape.points if not inside(p, outer)]
farthest = max(outside)
print(f"  lake corners outside the country's outer rings: {len(outside)} of"
      f" {sum(points(s) for _, s in lake_shapes)}, more than 1 km outside in"
      f" {sorted({name for d, name in outside if d > 1000})}; farthest {farthest[0] / 1000:.1f} km"
      f" from the nearest corner of the border ({farthest[1]})")
voting = {record["id"] for record, _ in layers["voting"][0]}
print(f"  voting municipalities ('Gemeinden (Politik)'): {len(voting)}; of the list without one:"
      f" {sorted(listed - voting)}")

# The map as SVG paths, coordinates rounded to the metre: its size.
X0, Y1 = 2485000, 1296000


def svg(shape):
    parts = list(shape.parts) + [len(shape.points)]
    out = []
    for a, b in zip(parts, parts[1:]):
        ring = [(round(x - X0), round(Y1 - y)) for x, y in shape.points[a:b]]
        out.append("M" + "l".join(f"{x - px} {y - py}" if i else f"{x} {y}"
                                  for i, ((x, y), (px, py)) in enumerate(zip(ring, [ring[0]] + ring)))
                   + "z")
    return "".join(out)


document = {
    "municipalities": [[r["GDENR"], svg(s)] for r, s in communes],
    "cantons": [[r["KTKZ"], svg(s)] for r, s in cantons],
    "lakes": [[r["name"], svg(s)] for r, s in layers["lakes 1"][0] + layers["lakes 2"][0]],
}
raw = json.dumps(document, ensure_ascii=False, separators=(",", ":")).encode()
print(f"the map as SVG paths in JSON, to the metre: {len(raw) // 1024} KB,"
      f" gzipped {len(gzip.compress(raw, 9)) // 1024} KB")
