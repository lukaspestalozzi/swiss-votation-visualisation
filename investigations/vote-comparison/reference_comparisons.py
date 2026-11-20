"""Found while proposing add-vote-comparison: the results of named comparisons, the figures the
spec vote-comparison cites.

Run as `python3 reference_comparisons.py` from any directory; standard library only, no download.
It imports the rules of the selection as `investigations/limits/reference_selections.py` writes
them, apart from the app, and applies them to two votes: the limits keep municipalities by the
figures that apply to the first vote, and exactly those municipalities count in both votes, with
the Swiss abroad of each canton in which one of them has an entry, while the switch counts them.
For contrast it also gives the second vote's result with the municipalities its own figures keep.
"""

import contextlib
import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "limits"))

# The module prints its own findings when it is loaded; they are not this file's.
with contextlib.redirect_stdout(io.StringIO()):
    from reference_selections import (  # noqa: E402
        CHARS,
        VOTES,
        at,
        characteristics,
        ends,
        remaining,
        report,
        step_up_to,
    )

FOREIGNERS = ("Ausländeranteil", 2)


def kept_by(vote_id, step):
    """The municipalities "Ausländeranteil" keeps with its upper bound at `step` of the track of
    the vote `vote_id`, by the figures that apply to that vote."""
    table = characteristics(VOTES[vote_id]["date"])
    values = table[FOREIGNERS]
    upper = at(FOREIGNERS, values, step)
    return upper, remaining(table, {FOREIGNERS: (ends(values)[0], upper)})


def main():
    everything = set(CHARS["municipalities"])
    first = 5960
    table = characteristics(VOTES[first]["date"])
    step = step_up_to(FOREIGNERS, table[FOREIGNERS], 2000)
    upper, keep = kept_by(first, step)
    print(f"The selection: Ausländeranteil (figures of vote {first}, {VOTES[first]['date']}) up to "
          f"step {step}, {upper} hundredths of a percent: {len(keep)} of {len(everything)} "
          "municipalities of the list remain; Swiss abroad counted")
    for second in (5970, 6310):
        print(f"\nVote {first} compared with vote {second} of {VOTES[second]['date']}:")
        report("  the first vote, real", first, everything, True)
        report("  the first vote, with the selection", first, keep, True)
        report("  the second vote, real", second, everything, True)
        report("  the second vote, with the same municipalities", second, keep, True)
        own_table = characteristics(VOTES[second]["date"])
        own_values = own_table[FOREIGNERS]
        own = remaining(own_table, {FOREIGNERS: (ends(own_values)[0], upper)})
        differ = len(keep ^ own)
        report(f"  for contrast, the second vote with its own figures up to {upper} "
               f"({len(own)} remain, {differ} differ)", second, own, True)


if __name__ == "__main__":
    main()
