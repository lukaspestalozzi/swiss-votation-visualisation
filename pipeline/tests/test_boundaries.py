from typing import Any

import made_up
import pytest

from pipeline.boundaries import Frame, read_cantons, read_municipalities, read_outline
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


def test_the_outline_and_the_cantons_are_read() -> None:
    outline = read_outline(made_up.boundaries("Country"), "country.zip")
    # The outer ring only: the hole, a lake, is drawn by the lakes.
    assert outline.frame == FRAME
    assert outline.path == "M0 120000l0 -120000l280000 0l0 120000z"
    cantons = read_cantons(made_up.boundaries("Canton"), FRAME, "cantons.zip")
    assert [abbreviation for abbreviation, _ in cantons][:3] == ["ZH", "BE", "LU"]
    assert len(cantons) == 26
    assert cantons[0] == ("ZH", "M10000 110000l0 -10000l10000 0l0 10000z")


def test_a_missing_canton_stops_the_run() -> None:
    shapes = [shape for shape in made_up.boundaries_shapes("Canton") if shape[0][2] != "JU"]
    content = made_up.boundaries("Canton", shapes=shapes)
    with pytest.raises(SourceError, match=r"cantons.zip: .*no border.*JU"):
        read_cantons(content, FRAME, "cantons.zip")


def test_a_canton_given_twice_stops_the_run() -> None:
    shapes = made_up.boundaries_shapes("Canton")
    content = made_up.boundaries("Canton", shapes=shapes + [shapes[1]])
    with pytest.raises(SourceError, match=r"cantons.zip: .*canton BE twice"):
        read_cantons(content, FRAME, "cantons.zip")


def test_a_country_without_an_outline_stops_the_run() -> None:
    content = made_up.boundaries("Country", shapes=[])
    with pytest.raises(SourceError, match=r"country.zip: .*no outline"):
        read_outline(content, "country.zip")
