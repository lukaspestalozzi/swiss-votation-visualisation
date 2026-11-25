"""Found after the merge (investigations/redesign.md, "The budgets on a slower machine").

What the budget tests measured in full runs of the browser tests: for each budget test, the
longest frame of each measurement, and how many measurements keep a budget, as it was and as
candidates for a new one. A measurement is one "frames:" line a budget test prints, the second
of a test that was measured once more included.

Usage, with the output of full runs saved as text, outside the repository:
  pnpm run test:e2e > /path/outside/the/repository/run-1.log 2>&1
  python3 investigations/redesign/budget_frames.py /path/outside/the/repository/run-*.log
"""

import re
import statistics
import sys
from collections import defaultdict

ANSI = re.compile(r"\x1b\[[0-9;]*m")
FRAMES = re.compile(r"\s*frames: \d+, longest [\d.]+ ms; (.*)")
RESULT = re.compile(r"\s*[✓✘]\s+\d+ e2e/([\w-]+)\.spec\.ts:\d+:\d+ › (.*?)(?: \(retry #\d+\))? \([\d.]+m?s\)")

# The tests whose every frame had 16 ms, by the start of their titles.
ONE_FRAME = (
    "compare: the budget: Dragging",
    "limits: the budget of a step by key",
    "limits: the budget of dragging with five",
    "limits: the budget of dragging: ",
    "result-map: the budget of clicking",
    "result-map: the budget: ",
)


def measurements(paths: list[str]) -> dict[str, list[list[float]]]:
    """Each budget test's measurements: the work of every frame, in ms."""
    found: dict[str, list[list[float]]] = defaultdict(list)
    for path in paths:
        waiting: list[list[float]] = []
        with open(path, encoding="utf-8", errors="replace") as log:
            for raw in log:
                line = ANSI.sub("", raw.rstrip("\n"))
                if match := FRAMES.match(line):
                    waiting.append([float(work) for work in re.findall(r"[a-z]+ ([\d.]+)", match[1])])
                elif (match := RESULT.match(line)) and waiting:
                    found[f"{match[1]}: {match[2]}"].extend(waiting)
                    waiting = []
    return found


def main(paths: list[str]) -> None:
    found = measurements(paths)
    print(f"{len(paths)} runs")
    print("the longest frame of a measurement, in ms: median, worst (measurements)")
    for title, frames in sorted(found.items()):
        longest = [max(of) for of in frames]
        print(f"  {title[:70]}: {statistics.median(longest):.1f}, {max(longest):.1f} ({len(frames)})")
    one_frame = {
        title: frames for title, frames in found.items() if title.startswith(ONE_FRAME)
    }
    every = [work for frames in one_frame.values() for of in frames for work in of]
    print(
        f"the frames of the tests with 16 ms per frame: {len(every)}; over 16 ms: "
        f"{sum(work > 16 for work in every)}, over 33 ms: {sum(work > 33 for work in every)}, "
        f"over 50 ms: {sum(work > 50 for work in every)}"
    )
    budgets = {
        "every frame within 16 ms": lambda of: max(of) <= 16,
        "every frame within 33 ms": lambda of: max(of) <= 33,
        "every frame within 50 ms": lambda of: max(of) <= 50,
        "nine in ten within 16 ms, none over 50 ms": lambda of: (
            sum(work > 16 for work in of) * 10 <= len(of) and max(of) <= 50
        ),
    }
    print("measurements that keep a budget:")
    for title, frames in sorted(one_frame.items()):
        kept = ", ".join(
            f"{name}: {sum(keeps(of) for of in frames)} of {len(frames)}"
            for name, keeps in budgets.items()
        )
        most = max(sum(work > 16 for work in of) for of in frames)
        print(f"  {title[:48]} ({len(frames[0])} frames; at most {most} over 16 ms): {kept}")


if __name__ == "__main__":
    main(sys.argv[1:])
