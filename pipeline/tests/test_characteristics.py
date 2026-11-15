import itertools
import json
from typing import Any

import made_up
import pytest

from pipeline.characteristics import (
    Cube,
    check_list,
    election_years,
    group_parties,
    onto_list,
    read_areas,
    read_cattle,
    read_correspondences,
    read_cube,
    read_elections,
    read_languages,
    read_population,
    required_years,
)
from pipeline.counts import SourceError
from pipeline.register import read_register

# The three queries of a year's single years of age (at most 100,000 cells each).
AGE_PARTS = [(0, 33), (34, 66), (67, 100)]


def cube(document: dict[str, Any], name: str) -> Cube:
    return read_cube(json.dumps(document).encode(), name)


def set_value(document: dict[str, Any], cell: dict[str, str], value: object) -> None:
    """Break a json-stat2 answer: the value of the cell named by a code of every dimension."""
    keys = itertools.product(
        *[list(document["dimension"][d]["category"]["index"]) for d in document["id"]]
    )
    index = list(keys).index(tuple(cell[d] for d in document["id"]))
    document["value"][index] = value


TOTAL = {"Bevölkerungstyp": "1", "Geschlecht": "-99999", "Alter": "-99999"}


def population_cubes(
    year: int = 2015, totals_document: dict[str, Any] | None = None
) -> tuple[Cube, list[Cube]]:
    document = made_up.population_totals() if totals_document is None else totals_document
    totals = cube(document, "population_totals.json")
    ages = [
        cube(made_up.population_ages(year, first, last), f"population_ages_{year}_{first}.json")
        for first, last in AGE_PARTS
    ]
    return totals, ages


def test_the_population_is_read_with_its_age_groups() -> None:
    totals, ages = population_cubes()
    population = read_population(totals, ages)
    groups = made_up.population_groups(351, 2015)
    assert population[2015][351] == [sum(groups), made_up.foreigners(351, 2015), *groups]
    assert set(population) == {2015}
    assert set(population[2015]) == set(made_up.EARLIER)


def test_a_missing_count_stops_the_run_and_is_named() -> None:
    document = made_up.population_totals()
    cell = TOTAL | {
        "Jahr": "2015",
        made_up.GEO: "0351",
        "Staatsangehörigkeit (Kategorie)": "-99999",
    }
    set_value(document, cell, None)
    totals, ages = population_cubes(totals_document=document)
    message = "population_totals.json, municipality 351, 2015: inhabitants is None"
    with pytest.raises(SourceError, match=f"^{message}, not a whole number from zero$"):
        read_population(totals, ages)


def code_of(document: dict[str, Any], dimension: str, label: str) -> str:
    """The code of the category with this label, in a table that codes by a running number."""
    labels: dict[str, str] = document["dimension"][dimension]["category"]["label"]
    return next(code for code, text in labels.items() if text == label)


def test_a_fraction_stops_the_run_and_is_named() -> None:
    document = made_up.farms()
    place = code_of(document, made_up.GEO, "......0002 Affoltern am Albis")
    cell = {"Beobachtungseinheit": "15", made_up.GEO: place, "Betriebssystem": "0"}
    set_value(document, cell | {"Jahr": code_of(document, "Jahr", "2015")}, 850.5)
    message = "cattle.json, municipality 2, 2015: cattle is 850.5"
    with pytest.raises(SourceError, match=f"^{message}, not a whole number from zero$"):
        read_cattle(cube(document, "cattle.json"))


def test_a_count_below_zero_stops_the_run_and_is_named() -> None:
    document = made_up.census()
    place = code_of(document, made_up.GEO, "......0351 Bern")
    cell = {"Wohnsitztyp": "1", made_up.GEO: place, "Staatsangehörigkeit (Kategorie)": "0"}
    set_value(document, cell | {"Hauptsprache": "1"}, -1)
    message = "census_2000.json, municipality 351, 2000: German is -1"
    with pytest.raises(SourceError, match=f"^{message}, not a whole number from zero$"):
        read_languages(cube(document, "census_2000.json"))


def listed(date: str) -> list[int]:
    """The numbers of the made-up register's list of `date`."""
    text = made_up.register_of(date) if date != "2026-01-01" else made_up.register()
    return [municipality.number for municipality in read_register(text, f"register_{date}.csv")]


def test_a_municipality_the_list_does_not_have_stops_the_run() -> None:
    document = made_up.population_totals()
    labels = document["dimension"][made_up.GEO]["category"]["label"]
    labels["0003"] = "......9999 Neudorf"
    totals = cube(document, "population_totals.json")
    numbers = totals.municipalities().values()
    with pytest.raises(SourceError, match=r"^population_totals.json: .*2025-04-06.*\b9999\b"):
        check_list(totals.source, "2025-04-06", numbers, listed("2025-04-06"))


def test_a_municipality_missing_from_a_table_stops_the_run() -> None:
    document = made_up.population_totals()
    document["dimension"][made_up.GEO]["category"]["label"]["0003"] = ">> Bezirk Neu"
    totals = cube(document, "population_totals.json")
    numbers = totals.municipalities().values()
    with pytest.raises(SourceError, match=r"^population_totals.json: .*2025-04-06.*missing \[3\]"):
        check_list(totals.source, "2025-04-06", numbers, listed("2025-04-06"))


AREAS_FILE = "swissBOUNDARIES3D_2026-01.zip"


def test_a_municipality_without_an_area_stops_the_run() -> None:
    rows = [row for row in made_up.area_rows() if row[1] != 351]
    areas = read_areas(made_up.swissboundaries(rows), AREAS_FILE)
    with pytest.raises(SourceError, match=rf"^{AREAS_FILE}: .*2026-01-01.*missing \[351\]"):
        check_list(AREAS_FILE, "2026-01-01", areas, listed("2026-01-01"))


def test_cattle_that_do_not_add_up_to_switzerland_stop_the_run() -> None:
    document = made_up.farms()
    swiss = code_of(document, made_up.GEO, "Schweiz")
    cell = {"Beobachtungseinheit": "15", made_up.GEO: swiss, "Betriebssystem": "0"}
    cell["Jahr"] = code_of(document, "Jahr", "2015")
    total = sum(made_up.cattle(number, 2015) for number in made_up.EARLIER)
    set_value(document, cell, total + 1)
    message = f"cattle.json, 2015: the municipalities add up to {total} cattle, not {total + 1}"
    with pytest.raises(SourceError, match=f"^{message}"):
        read_cattle(cube(document, "cattle.json"))


def test_inhabitants_that_do_not_add_up_to_switzerland_stop_the_run() -> None:
    document = made_up.population_totals()
    cell = TOTAL | {"Jahr": "2015", made_up.GEO: "8100", "Staatsangehörigkeit (Kategorie)": "2"}
    total = sum(made_up.foreigners(number, 2015) for number in made_up.EARLIER)
    set_value(document, cell, total - 1)
    totals, ages = population_cubes(totals_document=document)
    message = f"population_totals.json, 2015: the municipalities add up to {total} foreigners"
    with pytest.raises(SourceError, match=f"^{message}, not {total - 1}$"):
        read_population(totals, ages)


def test_a_language_that_does_not_add_up_to_switzerland_stops_the_run() -> None:
    document = made_up.census()
    swiss = code_of(document, made_up.GEO, "Schweiz")
    cell = {"Wohnsitztyp": "1", made_up.GEO: swiss, "Staatsangehörigkeit (Kategorie)": "0"}
    total = sum(made_up.languages(number)[4] for number in made_up.CENSUS_EARLIER)
    set_value(document, cell | {"Hauptsprache": "4"}, total + 2)
    message = f"census_2000.json, 2000: the municipalities add up to {total} Romansh"
    with pytest.raises(SourceError, match=f"^{message}, not {total + 2}$"):
        read_languages(cube(document, "census_2000.json"))


def test_ages_that_do_not_add_up_to_the_inhabitants_stop_the_run() -> None:
    totals, _ = population_cubes()
    document = made_up.population_ages(2015, 0, 33)
    cell = TOTAL | {
        "Jahr": "2015",
        made_up.GEO: "0001",
        "Staatsangehörigkeit (Kategorie)": "-99999",
    }
    first = made_up.population_groups(1, 2015)[0]
    set_value(document, cell | {"Alter": str(made_up.AGE_AT[0])}, first - 1)
    ages = [cube(document, "population_ages_2015_0.json")] + population_cubes()[1][1:]
    inhabitants = sum(made_up.population_groups(1, 2015))
    message = (
        f"population_totals.json, municipality 1, 2015: its single years of age add up to "
        f"{inhabitants - 1}, not to its {inhabitants} inhabitants"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_population(totals, ages)


def test_more_foreigners_than_inhabitants_stop_the_run() -> None:
    document = made_up.population_totals()
    inhabitants = sum(made_up.population_groups(389, 2015))
    cell = TOTAL | {"Jahr": "2015", made_up.GEO: "0389", "Staatsangehörigkeit (Kategorie)": "2"}
    set_value(document, cell, inhabitants + 1)
    totals, ages = population_cubes(totals_document=document)
    message = (
        f"population_totals.json, municipality 389, 2015: its {inhabitants + 1} foreigners "
        f"are more than its {inhabitants} inhabitants"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_population(totals, ages)


def election_cube(year: int = 2015, document: dict[str, Any] | None = None) -> Cube:
    given = made_up.election(year) if document is None else document
    return cube(given, f"election_{year}.json")


def test_a_district_that_does_not_add_up_stops_the_run() -> None:
    document = made_up.election(2015)
    cell = {made_up.ELECTION_PLACES: "000101", "Jahr": "2015", "Partei": "1", "Ergebnisse": "1"}
    total = sum(made_up.party_votes(number, 2015)["1"] for number in (1, 2, 3))
    set_value(document, cell, total + 1)
    message = (
        f"election_2015.json, 2015: the municipalities of '>> Bezirk Affoltern' add up to "
        f"{total} votes for FDP, not {total + 1}"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_elections(election_cube(document=document))


def test_an_area_of_zero_stops_the_run() -> None:
    rows = [row[:3] + [0] + row[4:] if row[1] == 351 else row for row in made_up.area_rows()]
    message = f"{AREAS_FILE}, municipality 351: the area is 0, not above zero"
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_areas(made_up.swissboundaries(rows), AREAS_FILE)


def test_a_municipality_without_party_votes_has_none() -> None:
    elections = read_elections(election_cube())
    assert elections[2015][389] is None
    assert elections[2015][1] is not None
    assert set(elections[2015]) == set(made_up.EARLIER)


def test_a_party_without_a_list_counts_zero() -> None:
    votes = read_elections(election_cube(2023))[2023][1]
    assert votes is not None
    mitte = made_up.party_votes(1, 2023)["34"]
    assert group_parties(votes)[1] == mitte


def test_the_seven_groups_of_parties() -> None:
    votes = read_elections(election_cube(2015))[2015][2]
    assert votes is not None
    given = made_up.party_votes(2, 2015)
    named = [given["1"], given["2"] + given["32"], given["3"], given["4"], given["31"], given["13"]]
    assert group_parties(votes) == [*named, given["7"]]


def successors(date: str) -> dict[int, set[int]]:
    return read_correspondences(made_up.correspondences(date), f"correspondences_{date}.csv")


def test_a_merger_adds_the_counts_of_its_parts() -> None:
    population = read_population(*population_cubes())[2015]
    rows: dict[int, list[int] | None] = dict(population.items())
    today = onto_list(rows, successors("2025-04-06"), listed("2026-01-01"), "population")
    assert today[2] == [a + b for a, b in zip(population[2], population[3], strict=True)]
    assert today[1] == population[1]
    assert sorted(today) == sorted(made_up.MUNICIPALITIES)


def test_a_new_number_keeps_the_counts() -> None:
    cattle = read_cattle(cube(made_up.farms(), "cattle.json"))[2015]
    rows: dict[int, list[int] | None] = {number: [head] for number, head in cattle.items()}
    today = onto_list(rows, successors("2025-04-06"), listed("2026-01-01"), "cattle")
    assert today[6831] == [made_up.cattle(700, 2015)]
    assert 700 not in today


def test_a_split_makes_a_group_with_the_counts_of_all() -> None:
    languages = read_languages(cube(made_up.census(), "census_2000.json"))
    # The split municipality first, so that the unchanged ones after it join its group (in the
    # real census, villages that joined Breggia alone come after the ones split in 2004).
    rows: dict[int, list[int] | None] = {4: languages[4]}
    rows.update(languages)
    today = onto_list(rows, successors("2000-12-05"), listed("2026-01-01"), "census")
    together = [sum(column) for column in zip(*(languages[n] for n in (1, 2, 3, 4)), strict=True)]
    assert today[1] == together
    assert today[2] == together
    assert today[351] == languages[351]


def test_an_election_without_a_day_stops_the_run() -> None:
    table = [2027, 2023, 2019, 2015, 2011, 2007]
    assert election_years(table[1:], "2013-03-03", "elections") == [2011, 2015, 2019, 2023]
    message = "elections: the elections of \\[2027\\] have no day in the pipeline's ELECTION_DAYS"
    with pytest.raises(SourceError, match=f"^{message}"):
        election_years(table, "2013-03-03", "elections")


def test_correspondences_without_a_change_are_an_empty_mapping() -> None:
    # A table on the votes' own list: the register names no municipality that changed.
    text = made_up.CORRESPONDENCES_HEADER + "\n"
    assert read_correspondences(text, "correspondences_2026-01-01.csv") == {}


def test_a_table_without_the_first_year_needed_stops_the_run() -> None:
    message = "population_totals.json: no figures of the years \\[2012\\]"
    with pytest.raises(SourceError, match=f"^{message}"):
        required_years(range(2013, 2026), 2012, "population_totals.json")


def test_a_year_missing_between_the_first_and_the_newest_stops_the_run() -> None:
    with pytest.raises(SourceError, match=r"^cattle.json: no figures of the years \[2017\]"):
        required_years([2014, 2015, 2016, 2018], 2015, "cattle.json")


def test_the_years_needed_are_those_from_the_first_on() -> None:
    assert required_years([2013, 2014, 2015, 2016], 2014, "cattle.json") == [2014, 2015, 2016]


def test_an_election_missing_from_the_last_before_the_first_vote_on_stops_the_run() -> None:
    message = r"^elections: no figures of the elections \[2011\]"
    with pytest.raises(SourceError, match=message):
        election_years([2015, 2019, 2023], "2013-03-03", "elections")
    message = r"^elections: no figures of the elections \[2019\]"
    with pytest.raises(SourceError, match=message):
        election_years([2007, 2011, 2015, 2023], "2013-03-03", "elections")
