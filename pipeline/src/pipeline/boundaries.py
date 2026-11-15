"""Reader of the map's sources: the BFS register's boundaries and the BFS ThemaKart set's lakes.

The register gives the boundaries of the municipalities, the cantons and the country on a date,
as a ZIP of a shapefile in the Swiss coordinate system LV95, in metres
(`investigations/map-data.md`). Every shape is kept as the BFS gives it, its corners rounded to
the metre and counted from the top left corner of the rectangle around Switzerland, written as
SVG path data: a first point, then relative steps.
"""

import io
import itertools
import zipfile
from collections.abc import Iterable
from dataclasses import dataclass

import shapefile

from pipeline.counts import SourceError


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


def _path(shape: shapefile.Shape, frame: Frame) -> str:
    """The shape's rings as SVG path data, in whole metres from the frame's top left corner."""
    parts = list(shape.parts) + [len(shape.points)]
    rings = []
    for start, end in itertools.pairwise(parts):
        corners = [(round(x) - frame.x_min, frame.y_max - round(y)) for x, y, *_ in
                   shape.points[start:end]]  # fmt: skip
        if len(corners) > 1 and corners[0] == corners[-1]:
            corners = corners[:-1]  # "z" closes the ring
        (x0, y0), steps = corners[0], []
        for (x, y), (px, py) in zip(corners[1:], corners):
            steps.append(f"l{x - px} {y - py}")
        rings.append(f"M{x0} {y0}{''.join(steps)}z")
    return "".join(rings)


def read_municipalities(
    content: bytes, listed: Iterable[int], frame: Frame, source: str
) -> list[tuple[int, str]]:
    """The boundary of every municipality of `listed`, by number."""
    layer, numbers = _layer(content, source), set(listed)
    paths: dict[int, str] = {}
    for record, shape in zip(layer.records(), layer.shapes()):
        if record is None or shape is None:
            raise SourceError(
                f"{source}: a shape without its record, or a record without its shape"
            )
        number = record["GDENR"]
        if not isinstance(number, int):
            raise SourceError(f"{source}: the number {number!r} is not a whole number")
        if number in paths:
            raise SourceError(f"{source}: the register gives the number {number} twice")
        paths[number] = _path(shape, frame)
    missing = sorted(numbers - set(paths))
    if missing:
        raise SourceError(f"{source}: no boundary for the municipalities {missing}")
    extra = sorted(set(paths) - numbers)
    if extra:
        raise SourceError(f"{source}: boundaries of numbers not on the list: {extra}")
    return [(number, paths[number]) for number in sorted(paths)]
