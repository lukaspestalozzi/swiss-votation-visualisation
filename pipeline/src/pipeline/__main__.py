"""The command line: `uv run --directory pipeline --locked python -m pipeline update`."""

import argparse
import datetime
import sys
from collections.abc import Sequence
from pathlib import Path

from pipeline.counts import SourceError
from pipeline.download import Fetch, fetch_url
from pipeline.update import update

# pipeline/src/pipeline/__main__.py: the project is two levels up, the repository three.
PROJECT = Path(__file__).resolve().parents[2]
DATA = PROJECT.parent / "app" / "static" / "data"


def main(
    argv: Sequence[str] | None = None,
    *,
    fetch: Fetch = fetch_url,
    today: str | None = None,
    project: Path = PROJECT,
    data: Path = DATA,
) -> int:
    parser = argparse.ArgumentParser(prog="python -m pipeline")
    commands = parser.add_subparsers(dest="command", required=True)
    command = commands.add_parser(
        "update",
        help="download the sources, check them, and write the data files of the app",
    )
    command.add_argument(
        "--reuse-downloads",
        action="store_true",
        help="use the files in pipeline/downloads/ where they are there (for development)",
    )
    arguments = parser.parse_args(argv)
    try:
        report = update(
            project,
            data,
            fetch,
            today or datetime.date.today().isoformat(),
            reuse_downloads=arguments.reuse_downloads,
        )
    except SourceError as error:
        print(f"update stopped, the data files are unchanged: {error}", file=sys.stderr)
        return 1
    print(f"list of municipalities: {report.reference_date}")
    print(
        f"votes: {report.votes}, of them validated: {report.validated}, "
        f"not validated yet: {report.votes - report.validated}"
    )
    print(f"added: {', '.join(report.added) or 'none'}")
    print(f"validated since the last run: {', '.join(report.newly_validated) or 'none'}")
    print(f"left out, no complete result yet: {', '.join(report.left_out) or 'none'}")
    print(f"data files written to {data}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
