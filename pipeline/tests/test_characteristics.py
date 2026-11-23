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
    read_born_abroad,
    read_buildings,
    read_cattle,
    read_correspondences,
    read_cube,
    read_dwellings,
    read_education,
    read_elections,
    read_farms,
    read_jobs,
    read_languages,
    read_population,
    read_religions,
    required_years,
)
from pipeline.counts import SourceError
from pipeline.download import JOB_PARTS, ROOM_PARTS
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


def test_municipalities_named_without_dots_are_read_with_their_numbers() -> None:
    # Three tables have a dimension "Gemeinde": "0001 Aeugst am Albis", beside Switzerland.
    found = cube(made_up.buildings(), "buildings_2000.json").municipalities("Gemeinde")
    assert found == {f"{number:04d}": number for number in made_up.CENSUS_EARLIER}
    assert "0000" not in found


BORN = {"Bevölkerungstyp": "1", "Geschlecht": "-99999", "Zivilstand": "-99999"}


def born_abroad(document: dict[str, Any] | None = None) -> dict[int, dict[int, int]]:
    """Those born abroad as read, beside the population of 2015."""
    given = made_up.birthplace() if document is None else document
    return read_born_abroad(cube(given, "born_abroad.json"), read_population(*population_cubes()))


def test_those_born_abroad_are_read_for_every_year() -> None:
    born = born_abroad()
    assert born[2015][351] == made_up.born_abroad(351, 2015)
    assert born[2025][1] == made_up.born_abroad(1, 2025)
    assert set(born) == set(made_up.POPULATION_YEARS)
    assert set(born[2015]) == set(made_up.EARLIER)


def test_a_missing_count_of_those_born_abroad_stops_the_run() -> None:
    document = made_up.birthplace()
    set_value(document, BORN | {"Jahr": "2015", made_up.GEO: "0351", "Geburtsort": "2"}, None)
    message = "born_abroad.json, municipality 351, 2015: born abroad is None"
    with pytest.raises(SourceError, match=f"^{message}, not a whole number from zero$"):
        born_abroad(document)


def test_those_born_abroad_that_do_not_add_up_to_switzerland_stop_the_run() -> None:
    document = made_up.birthplace()
    total = sum(made_up.born_abroad(number, 2015) for number in made_up.EARLIER)
    set_value(document, BORN | {"Jahr": "2015", made_up.GEO: "8100", "Geburtsort": "2"}, total + 1)
    message = f"born_abroad.json, 2015: the municipalities add up to {total} born abroad"
    with pytest.raises(SourceError, match=f"^{message}, not {total + 1}$"):
        born_abroad(document)


def test_inhabitants_that_differ_from_the_population_tables_stop_the_run() -> None:
    document = made_up.birthplace()
    inhabitants = sum(made_up.population_groups(351, 2015))
    cell = BORN | {"Jahr": "2015", made_up.GEO: "0351", "Geburtsort": "-99999"}
    set_value(document, cell, inhabitants - 1)
    message = (
        f"born_abroad.json, municipality 351, 2015: its {inhabitants - 1} inhabitants are not "
        f"the {inhabitants} of the population table"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        born_abroad(document)


def test_a_year_only_one_table_gives_is_not_compared() -> None:
    # The population as read here has 2015 only; the place of birth also gives the other years.
    document = made_up.birthplace()
    cell = BORN | {"Jahr": "2014", made_up.GEO: "0351", "Geburtsort": "-99999"}
    set_value(document, cell, 1)
    assert born_abroad(document)[2014][351] == made_up.born_abroad(351, 2014)


def test_the_religions_are_read() -> None:
    read = read_religions(cube(made_up.religion(), "religion_2000.json"))
    given = made_up.religions(351)
    assert read[351] == [sum(given.values()), given["1"], given["8"], given["17"]]
    assert set(read) == set(made_up.CENSUS_EARLIER)


def religion_cell(document: dict[str, Any], label: str, religion: str) -> dict[str, str]:
    """The cell of a place, by its label, and a religion, by its code."""
    return {
        "Wohnsitztyp": "1",
        made_up.GEO: code_of(document, made_up.GEO, label),
        "Religion": religion,
    }


def test_a_religion_without_a_count_stops_the_run_and_is_named() -> None:
    document = made_up.religion()
    set_value(document, religion_cell(document, "......0351 Bern", "8"), None)
    message = "religion_2000.json, municipality 351, 2000: Roman Catholic is None"
    with pytest.raises(SourceError, match=f"^{message}, not a whole number from zero$"):
        read_religions(cube(document, "religion_2000.json"))


def test_religions_that_do_not_add_up_to_the_inhabitants_stop_the_run() -> None:
    # A religion the characteristics do not name counts too: the Islamic communities.
    document = made_up.religion()
    given = made_up.religions(351)
    set_value(document, religion_cell(document, "......0351 Bern", "13"), given["13"] - 1)
    total = sum(given.values())
    message = (
        f"religion_2000.json, municipality 351, 2000: its religions add up to {total - 1}, "
        f"not to its {total} inhabitants"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_religions(cube(document, "religion_2000.json"))


def test_a_religion_that_does_not_add_up_to_switzerland_stops_the_run() -> None:
    document = made_up.religion()
    total = sum(made_up.religions(number)["8"] for number in made_up.CENSUS_EARLIER)
    set_value(document, religion_cell(document, "Schweiz", "8"), total + 1)
    message = f"religion_2000.json, 2000: the municipalities add up to {total} Roman Catholic"
    with pytest.raises(SourceError, match=f"^{message}, not {total + 1}$"):
        read_religions(cube(document, "religion_2000.json"))


def test_the_three_levels_of_education_are_read_from_the_tables_thirteen() -> None:
    read = read_education(cube(made_up.education(), "education_2000.json"))
    given = made_up.education_levels(351)
    assert read[351] == [
        given["1"] + given["2"],
        given["3"] + given["4"] + given["5"] + given["6"],
        given["7"] + given["8"] + given["9"] + given["10"],
    ]
    assert set(read) == set(made_up.CENSUS_EARLIER)


def education_cell(document: dict[str, Any], label: str, level: str) -> dict[str, str]:
    """The cell of a place, by its label, and a level of education, by its code."""
    return {
        "Höchste abgeschlossene Ausbildung": level,
        made_up.GEO: code_of(document, made_up.GEO, label),
        "Staatsangehörigkeit (Kategorie)": "0",
        "Geschlecht": "0",
    }


def test_levels_of_education_that_do_not_add_up_to_the_inhabitants_stop_the_run() -> None:
    # Those of school age count among the inhabitants, though in none of the three levels.
    document = made_up.education()
    given = made_up.education_levels(351)
    set_value(document, education_cell(document, "......0351 Bern", "12"), given["12"] + 1)
    total = sum(given.values())
    message = (
        f"education_2000.json, municipality 351, 2000: its levels of education add up to "
        f"{total + 1}, not to its {total} inhabitants"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_education(cube(document, "education_2000.json"))


def test_a_level_of_education_that_does_not_add_up_to_switzerland_stops_the_run() -> None:
    document = made_up.education()
    total = sum(made_up.education_levels(number)["10"] for number in made_up.CENSUS_EARLIER)
    set_value(document, education_cell(document, "Schweiz", "10"), total - 1)
    message = (
        f"education_2000.json, 2000: the municipalities add up to {total} Universität, Hochschule"
    )
    with pytest.raises(SourceError, match=f"^{message}, not {total - 1}$"):
        read_education(cube(document, "education_2000.json"))


def dwellings_cubes() -> list[Cube]:
    return [
        cube(made_up.dwellings(rooms), f"dwellings_2000_{rooms[0]}.json") for rooms in ROOM_PARTS
    ]


def test_the_occupied_dwellings_are_added_up_over_the_rooms() -> None:
    read = read_dwellings(dwellings_cubes())
    sizes = [str(rooms) for rooms in range(1, 11)]
    occupied = [
        made_up.dwellings_occupied(351, size, occupant)
        for size in sizes
        for occupant in made_up.OCCUPANTS
    ]
    # The owners: of the flat, of the house alone, of the house with others.
    owners = [
        made_up.dwellings_occupied(351, size, occupant)
        for size in sizes
        for occupant in ("3", "4", "5")
    ]
    assert read[351] == [sum(occupied), sum(owners)]
    assert set(read) == set(made_up.CENSUS_EARLIER)


def test_the_buildings_with_dwellings_and_the_single_family_houses_are_read() -> None:
    read = read_buildings(cube(made_up.buildings(), "buildings_2000.json"))
    built = {
        kind: sum(made_up.buildings_built(351, kind, period) for period in made_up.BUILDING_PERIODS)
        for kind in made_up.BUILDING_KINDS
    }
    assert read[351] == [sum(built.values()), built["EFH"]]
    assert set(read) == set(made_up.CENSUS_EARLIER)


def test_dwellings_of_another_year_stop_the_run() -> None:
    # The table also gives 1990: an answer must be the one asked for 2000.
    answer = cube(made_up.dwellings(ROOM_PARTS[0], year="1990"), "dwellings_2000_1.json")
    message = r"dwellings_2000_1.json: its figures are of the years \['1990'\], not of 2000 alone"
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_dwellings([answer, *dwellings_cubes()[1:]])


def test_dwellings_that_do_not_add_up_to_switzerland_stop_the_run() -> None:
    document = made_up.dwellings(ROOM_PARTS[0])
    cell = {"Gemeinde": "CH", "Anzahl Zimmer": "3", "Bewohnertyp": "1", "Jahr": "2000"}
    total = sum(made_up.dwellings_occupied(n, "3", "1") for n in made_up.CENSUS_EARLIER)
    set_value(document, cell, total + 1)
    message = (
        f"dwellings_2000_1.json, 2000: the municipalities add up to {total} occupied dwellings "
        rf"\(3 Zimmer, Mieter/in\), not {total + 1}"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_dwellings([cube(document, "dwellings_2000_1.json"), *dwellings_cubes()[1:]])


def test_buildings_that_do_not_add_up_to_switzerland_stop_the_run() -> None:
    document = made_up.buildings()
    cell = {"Gemeinde": "0000", "Gebäudekategorie": "EFH", "Bauperiode": "8", "Jahr": "2000"}
    total = sum(made_up.buildings_built(n, "EFH", "8") for n in made_up.CENSUS_EARLIER)
    set_value(document, cell, total - 1)
    message = (
        f"buildings_2000.json, 2000: the municipalities add up to {total} buildings with "
        rf"dwellings \(Einfamilienhäuser, Zwischen 1996 und 2000 erbaut\), not {total - 1}"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_buildings(cube(document, "buildings_2000.json"))


def jobs_cubes(first: dict[str, Any] | None = None) -> list[Cube]:
    """The jobs' two answers, by sectors; `first` in the place of the one with all jobs."""
    documents = [made_up.jobs(sectors) for sectors in JOB_PARTS]
    if first is not None:
        documents[0] = first
    return [
        cube(document, f"jobs_{sectors[0]}.json")
        for document, sectors in zip(documents, JOB_PARTS, strict=True)
    ]


def test_the_four_counts_of_the_jobs_are_read() -> None:
    jobs = read_jobs(jobs_cubes())
    assert jobs[2015][351] == made_up.jobs_counted(351, 2015)
    assert set(jobs) == set(made_up.JOB_YEARS)
    assert set(jobs[2015]) == set(made_up.EARLIER)


def test_a_withheld_count_of_the_jobs_is_none() -> None:
    jobs = read_jobs(jobs_cubes())
    counted = made_up.jobs_counted(389, 2015)
    assert jobs[2015][389] == [counted[0], counted[1], None, None]


def set_sign(document: dict[str, Any], cell: dict[str, str], sign: str) -> None:
    """Break a json-stat2 answer: a sign in place of the value of a cell."""
    keys = itertools.product(
        *[list(document["dimension"][d]["category"]["index"]) for d in document["id"]]
    )
    index = list(keys).index(tuple(cell[d] for d in document["id"]))
    document["value"][index] = None
    document["status"][str(index)] = sign


def jobs_cell(number: int, year: int, sector: str) -> dict[str, str]:
    return {
        "Jahr": str(year),
        "Gemeinde": str(number),
        "Wirtschaftssektor": sector,
        "Beobachtungseinheit": "2",
    }


def test_another_sign_in_the_jobs_table_stops_the_run_and_is_named() -> None:
    document = made_up.jobs(JOB_PARTS[0])
    set_sign(document, jobs_cell(351, 2015, "999"), "...")
    message = "jobs_999.json, municipality 351, 2015: jobs is None"
    with pytest.raises(SourceError, match=f"^{message}, not a whole number from zero$"):
        read_jobs(jobs_cubes(document))


def test_sectors_that_do_not_add_up_to_all_jobs_stop_the_run() -> None:
    document = made_up.jobs(JOB_PARTS[0])
    counted = made_up.jobs_counted(351, 2015)
    set_value(document, jobs_cell(351, 2015, "1"), counted[1] - 1)
    message = (
        f"jobs_999.json, municipality 351, 2015: its sectors add up to {counted[0] - 1}, "
        f"not to its {counted[0]} jobs"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_jobs(jobs_cubes(document))


def test_with_a_sector_withheld_the_sum_is_not_compared() -> None:
    document = made_up.jobs(JOB_PARTS[0])
    set_sign(document, jobs_cell(351, 2015, "1"), "X")
    counted = made_up.jobs_counted(351, 2015)
    jobs = read_jobs(jobs_cubes(document))
    assert jobs[2015][351] == [counted[0], None, counted[2], counted[3]]


def test_the_jobs_are_not_added_up_over_switzerland() -> None:
    # Switzerland's figures count what the table withholds of a municipality.
    counted = [made_up.jobs_counted(number, 2015)[2] for number in made_up.EARLIER]
    given = [made_up.jobs_of(number, 2015)[2] for number in made_up.EARLIER]
    assert sum(held for held in given if held is not None) < sum(counted)
    jobs = read_jobs(jobs_cubes())
    assert [jobs[2015][number][2] for number in made_up.EARLIER] == given


def test_a_part_without_a_count_leaves_the_sum_without_one() -> None:
    # Bonstetten (3) is part of Affoltern am Albis (2) today; its count is withheld.
    rows: dict[int, list[int] | None] = {number: [10] for number in made_up.EARLIER}
    rows[3] = None
    today = onto_list(
        rows, successors("2024-01-01"), listed("2026-01-01"), "the jobs", all_parts=True
    )
    assert today[2] is None
    assert today[1] == [10]
    assert today[6831] == [10]


def test_a_part_without_an_election_result_adds_nothing() -> None:
    # The elections' rule stays: Bonstetten (3) counts its votes with another municipality.
    rows: dict[int, list[int] | None] = {number: [10] for number in made_up.EARLIER}
    rows[3] = None
    today = onto_list(rows, successors("2023-01-01"), listed("2026-01-01"), "the election")
    assert today[2] == [10]


# The farms table's three further answers: the farms, the farmland, the organic farmland.
FARM_ANSWERS = {"farms": ("0", "0"), "farmland": ("10", "0"), "organic_farmland": ("10", "1")}


def farm_cubes(**changed: dict[str, Any]) -> list[Cube]:
    """The three answers, each as made up or as `changed` gives it by its name."""
    return [
        cube(changed.get(name, made_up.farms(unit, system)), f"{name}.json")
        for name, (unit, system) in FARM_ANSWERS.items()
    ]


def test_the_farms_and_their_farmland_are_read() -> None:
    farms = read_farms(*farm_cubes())
    assert farms[2015][2] == made_up.farms_of(2, 2015)
    assert farms[2015][351] == [0, 0, 0]
    assert set(farms) == set(made_up.FARM_YEARS)
    assert set(farms[2015]) == set(made_up.EARLIER)


def farm_cell(document: dict[str, Any], label: str, year: int) -> dict[str, str]:
    """The cell of a place, by its label, and a year in an answer of the farms table."""

    def only(dimension: str) -> str:
        return str(next(iter(document["dimension"][dimension]["category"]["index"])))

    return {
        "Beobachtungseinheit": only("Beobachtungseinheit"),
        made_up.GEO: code_of(document, made_up.GEO, label),
        "Betriebssystem": only("Betriebssystem"),
        "Jahr": code_of(document, "Jahr", str(year)),
    }


def test_farms_that_do_not_add_up_to_switzerland_stop_the_run() -> None:
    document = made_up.farms("0", "0")
    total = sum(made_up.farms_of(number, 2015)[0] for number in made_up.EARLIER)
    set_value(document, farm_cell(document, "Schweiz", 2015), total + 1)
    message = f"farms.json, 2015: the municipalities add up to {total} farms, not {total + 1}"
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_farms(*farm_cubes(farms=document))


def test_farmland_that_does_not_add_up_to_switzerland_is_accepted() -> None:
    # Each municipality's farmland is a whole number of hectares, Switzerland's the rounded sum.
    documents = {}
    for i, name in ((1, "farmland"), (2, "organic_farmland")):
        documents[name] = made_up.farms(*FARM_ANSWERS[name])
        total = sum(made_up.farms_of(number, 2015)[i] for number in made_up.EARLIER)
        set_value(documents[name], farm_cell(documents[name], "Schweiz", 2015), total + 3)
    farms = read_farms(*farm_cubes(**documents))
    assert farms[2015][2] == made_up.farms_of(2, 2015)


def test_more_organic_farmland_than_farmland_stops_the_run() -> None:
    document = made_up.farms(*FARM_ANSWERS["organic_farmland"])
    farmland = made_up.farms_of(2, 2015)[1]
    cell = farm_cell(document, "......0002 Affoltern am Albis", 2015)
    set_value(document, cell, farmland + 1)
    message = (
        f"organic_farmland.json, municipality 2, 2015: its {farmland + 1} hectares of organic "
        f"farmland are more than its {farmland} hectares of farmland"
    )
    with pytest.raises(SourceError, match=f"^{message}$"):
        read_farms(*farm_cubes(organic_farmland=document))
