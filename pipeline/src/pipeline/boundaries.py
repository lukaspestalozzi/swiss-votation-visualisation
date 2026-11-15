"""Reader of the map's sources: the BFS register's boundaries and the BFS ThemaKart set's lakes.

The register gives the boundaries of the municipalities, the cantons and the country on a date,
as a ZIP of a shapefile in the Swiss coordinate system LV95, in metres
(`investigations/map-data.md`). Every shape is kept as the BFS gives it, its corners rounded to
the metre and counted from the top left corner of the rectangle around Switzerland, written as
SVG path data: a first point, then relative steps.
"""

import io
import itertools
import math
import zipfile
from collections.abc import Iterable, Iterator
from dataclasses import dataclass

import shapefile

from pipeline.counts import SourceError
from pipeline.feed import CANTONS


@dataclass(frozen=True)
class Frame:
    """The rectangle around Switzerland, in whole metres of LV95: its left and top edges."""

    x_min: int
    y_max: int
    width: int
    height: int


def _layer(content: bytes, source: str, stem: str | None = None) -> shapefile.Reader:
    """The shapefile in the ZIP `content`: the only one, or the one whose file is `stem`."""
    try:
        archive = zipfile.ZipFile(io.BytesIO(content))
    except zipfile.BadZipFile as error:
        raise SourceError(f"{source}: not a ZIP ({error})") from error
    stems = {n[:-4] for n in archive.namelist() if n.lower().endswith(".shp")}
    chosen = [s for s in stems if stem is None or s.rsplit("/", 1)[-1] == stem]
    if len(chosen) != 1:
        raise SourceError(f"{source}: no single shapefile {stem or ''} in {sorted(stems)}")
    base = chosen[0]
    return shapefile.Reader(
        shp=io.BytesIO(archive.read(base + ".shp")),
        shx=io.BytesIO(archive.read(base + ".shx")),
        dbf=io.BytesIO(archive.read(base + ".dbf")),
        encoding="utf-8",
    )


@dataclass(frozen=True)
class Outline:
    """The outline of Switzerland: the rectangle around it, and its outer rings as SVG path
    data. Its holes are lakes; the map draws the outline in the lakes' colour."""

    frame: Frame
    path: str


def _shapes(
    layer: shapefile.Reader, source: str
) -> Iterator[tuple[shapefile._Record, shapefile.Shape]]:
    """Each record of the layer with its shape."""
    for record, shape in zip(layer.records(), layer.shapes()):
        if record is None or shape is None:
            raise SourceError(
                f"{source}: a shape without its record, or a record without its shape"
            )
        yield record, shape


def _rings(shape: shapefile.Shape) -> list[list[tuple[float, float]]]:
    parts = list(shape.parts) + [len(shape.points)]
    return [[(p[0], p[1]) for p in shape.points[a:b]] for a, b in itertools.pairwise(parts)]


def _signed_area(ring: list[tuple[float, float]]) -> float:
    """Negative for an outer ring, positive for a hole: shapefiles run outer rings clockwise."""
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1])) / 2


def _path(rings: list[list[tuple[float, float]]], frame: Frame) -> str:
    """Rings as SVG path data, in whole metres from the frame's top left corner."""
    paths = []
    for ring in rings:
        corners = [(round(x) - frame.x_min, frame.y_max - round(y)) for x, y in ring]
        if len(corners) > 1 and corners[0] == corners[-1]:
            corners = corners[:-1]  # "z" closes the ring
        steps = [f"l{x - px} {y - py}" for (x, y), (px, py) in zip(corners[1:], corners)]
        paths.append(f"M{corners[0][0]} {corners[0][1]}{''.join(steps)}z")
    return "".join(paths)


def read_municipalities(
    content: bytes, listed: Iterable[int], frame: Frame, source: str
) -> list[tuple[int, str]]:
    """The boundary of every municipality of `listed`, by number."""
    layer, numbers = _layer(content, source), set(listed)
    paths: dict[int, str] = {}
    for record, shape in _shapes(layer, source):
        number = record["GDENR"]
        if not isinstance(number, int):
            raise SourceError(f"{source}: the number {number!r} is not a whole number")
        if number in paths:
            raise SourceError(f"{source}: the register gives the number {number} twice")
        paths[number] = _path(_rings(shape), frame)
    missing = sorted(numbers - set(paths))
    if missing:
        raise SourceError(f"{source}: no boundary for the municipalities {missing}")
    extra = sorted(set(paths) - numbers)
    if extra:
        raise SourceError(f"{source}: boundaries of numbers not on the list: {extra}")
    return [(number, paths[number]) for number in sorted(paths)]


def read_outline(content: bytes, source: str) -> Outline:
    """The register's country: its outer rings, and the rectangle around them."""
    outer = [
        ring
        for _, shape in _shapes(_layer(content, source), source)
        for ring in _rings(shape)
        if _signed_area(ring) < 0
    ]
    if not outer:
        raise SourceError(f"{source}: the register gives no outline of Switzerland")
    xs = [x for ring in outer for x, _ in ring]
    ys = [y for ring in outer for _, y in ring]
    x_min, y_max = math.floor(min(xs)), math.ceil(max(ys))
    frame = Frame(x_min, y_max, math.ceil(max(xs)) - x_min, y_max - math.floor(min(ys)))
    return Outline(frame, _path(outer, frame))


def read_cantons(content: bytes, frame: Frame, source: str) -> list[tuple[str, str]]:
    """The border of each of the 26 cantons, in the order of the constitution."""
    paths: dict[str, str] = {}
    for record, shape in _shapes(_layer(content, source), source):
        abbreviation = str(record["KTKZ"])
        if abbreviation in paths:
            raise SourceError(f"{source}: the register gives the canton {abbreviation} twice")
        paths[abbreviation] = _path(_rings(shape), frame)
    missing = [abbreviation for abbreviation in CANTONS if abbreviation not in paths]
    if missing:
        raise SourceError(f"{source}: no border for the cantons {missing}")
    return [(abbreviation, paths[abbreviation]) for abbreviation in CANTONS]
