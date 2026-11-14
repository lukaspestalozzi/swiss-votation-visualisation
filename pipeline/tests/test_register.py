import made_up
import pytest

from pipeline.counts import SourceError
from pipeline.register import Municipality, read_register

SOURCE = "register_2026-01-01.csv"


def test_the_municipalities_are_read_with_number_name_and_canton() -> None:
    municipalities = read_register(made_up.register(), SOURCE)
    assert len(municipalities) == 6
    assert municipalities[0] == Municipality(1, "Aeugst am Albis", "ZH")
    assert Municipality(6831, "Moutier", "JU") in municipalities


def test_a_number_given_twice_stops() -> None:
    text = made_up.register() + "99999,1,01.01.2026,,3,10241,Doppelt,Doppelt,,,,\n"
    with pytest.raises(SourceError, match=r"register_2026-01-01.csv, municipality 1: .*twice"):
        read_register(text, SOURCE)


@pytest.mark.parametrize(
    ("row", "message"),
    [
        ("99999,7999,01.01.2026,,3,10241,,,,,,", "no name"),
        ("99999,7999,01.01.2026,,3,1,Ohne Bezirk,Ohne Bezirk,,,,", "canton is None"),
        (("99998,1101,01.01.2026,,2,7,Bezirk X,X,,,,\n"
          "7,27,01.01.2026,,1,,Kanton X,XX,,,,\n"
          "99999,7999,01.01.2026,,3,99998,Anderswo,Anderswo,,,,"), "canton is 'XX'"),
    ],
    ids=["no name", "no district", "canton XX"],
)  # fmt: skip
def test_a_municipality_without_a_name_or_one_of_the_26_cantons_stops(
    row: str, message: str
) -> None:
    with pytest.raises(SourceError, match=rf"municipality 7999: .*{message}"):
        read_register(made_up.register() + row + "\n", SOURCE)
