"""The STAT-TAB answers of final figures, kept in the repository (spec characteristics, "The
answers of final figures are kept"; design of cache-stat-tab-answers).

Each answer is `<name>.gz` in the cache's directory, gzipped without a time in its header so
that the same answer gives the same bytes; `index.json` names for each the query that asked it
and the checksum of the answer. An answer is served only for the same query.
"""

import gzip
import hashlib
import json
from collections.abc import Iterable
from pathlib import Path

from pipeline.counts import SourceError

INDEX = "index.json"


def final_years(years: Iterable[int]) -> set[int]:
    """The years whose figures no longer change: all but the newest the table gives, which the
    BFS may still revise (design of cache-stat-tab-answers, decision 2). The census of 2000 is
    final as a whole."""
    given = set(years)
    return given - {max(given)} if given else set()


class Cache:
    def __init__(self, directory: Path) -> None:
        self.directory = directory
        self.index: dict[str, dict[str, str]] = {}
        path = directory / INDEX
        if path.exists():
            self.index = json.loads(path.read_text(encoding="utf-8"))
        files = (
            {p.name[: -len(".gz")] for p in directory.glob("*.gz")} if directory.exists() else set()
        )
        for name in sorted(files - set(self.index)):
            raise SourceError(f"{directory / name}.gz: in the cache without an entry in {INDEX}")
        for name in sorted(set(self.index) - files):
            raise SourceError(f"{directory / INDEX}: {name} has no file in the cache")

    def read(self, name: str, query: str) -> bytes | None:
        """The answer kept under `name`, if it answers `query`."""
        entry = self.index.get(name)
        if entry is None or entry["query"] != query:
            return None
        content = gzip.decompress((self.directory / f"{name}.gz").read_bytes())
        if hashlib.sha256(content).hexdigest() != entry["sha256"]:
            raise SourceError(f"{self.directory / name}.gz: not the answer {INDEX} names")
        return content

    def write(self, name: str, query: str, content: bytes) -> None:
        """Keep `content` under `name` as the answer to `query`."""
        self.directory.mkdir(parents=True, exist_ok=True)
        _replace(self.directory / f"{name}.gz", gzip.compress(content, compresslevel=9, mtime=0))
        self.index[name] = {"query": query, "sha256": hashlib.sha256(content).hexdigest()}
        text = json.dumps(self.index, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
        _replace(self.directory / INDEX, text.encode("utf-8"))


def _replace(path: Path, content: bytes) -> None:
    part = path.with_name(path.name + ".part")
    part.write_bytes(content)
    part.replace(path)
