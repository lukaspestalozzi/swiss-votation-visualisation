from typing import Any

import made_up
import pytest

from pipeline.boundaries import Frame, read_municipalities
from pipeline.counts import SourceError

# The made-up country's rectangle: x from 2,490,000, y up to 1,210,000.
FRAME = Frame(x_min=2_490_000, y_max=1_210_000, width=280_000, height=120_000)
LISTED = list(made_up.MUNICIPALITIES)


def test_the_boundaries_are_read_and_rounded_to_the_metre() -> None:
    paths = read_municipalities(made_up.boundaries("Commune"), LISTED, FRAME, "communes.zip")
    assert [number for number, _ in paths] == [1, 2, 351, 389, 6711, 6831]
    # 2,600,000.4 and 1,200,000.6 become 2,600,000 and 1,200,001, from the top left corner.
    assert paths[0] == (1, "M110000 9999l0 -999l1001 0l0 999z")
    assert paths[1] == (2, "M111000 10000l0 -1000l1000 0l0 1000z")


def communes_without(number: int) -> bytes:
    shapes = [shape for shape in made_up.boundaries_shapes("Commune") if shape[0][2] != number]
    return made_up.boundaries("Commune", shapes=shapes)


def test_a_municipality_without_a_boundary_stops_the_run() -> None:
    with pytest.raises(SourceError, match=r"communes.zip: .*no boundary.*\b351\b"):
        read_municipalities(communes_without(351), LISTED, FRAME, "communes.zip")


def test_a_boundary_of_no_municipality_stops_the_run() -> None:
    galm: tuple[list[Any], list[made_up.Ring]] = (
        ["Staatswald Galm", 12391, 2391, "", 10, "FR"],
        [made_up.municipality_ring(2)],
    )
    shapes = made_up.boundaries_shapes("Commune") + [galm]
    content = made_up.boundaries("Commune", shapes=shapes)
    with pytest.raises(SourceError, match=r"communes.zip: .*not on the list.*\b2391\b"):
        read_municipalities(content, LISTED, FRAME, "communes.zip")


def test_a_number_given_twice_stops_the_run() -> None:
    shapes = made_up.boundaries_shapes("Commune")
    content = made_up.boundaries("Commune", shapes=shapes + [shapes[0]])
    with pytest.raises(SourceError, match=r"communes.zip: .*number 1 twice"):
        read_municipalities(content, LISTED, FRAME, "communes.zip")
