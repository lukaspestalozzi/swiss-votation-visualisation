"""Reference values for tests: the votes in which the rules matter, with their figures."""

from readers import feed_votes
from sources import data_dir

feed = [v for v in feed_votes(data_dir()) if v["yes"] is not None]


def show(vote):
    cantons = f"{vote['cantons_yes']:g} : {vote['cantons_no']:g}" if vote["cantons_yes"] is not None else "none given"
    print(f"  {vote['day']} id {vote['id']} kind {vote['kind']} {'double' if vote['double'] else 'voters only'}"
          f" | valid {vote['valid']:,} yes {vote['yes']:,} no {vote['no']:,}"
          f" ({100 * vote['yes'] / (vote['yes'] + vote['no']):.4f}%) | cantons {cantons}"
          f" | {'passed' if vote['accepted'] else 'failed'}{', provisional' if vote['provisional'] else ''}"
          f" | {vote['titles']['de'][:58]}")


voters = lambda v: v["yes"] > v["no"]
cantons = lambda v: v["cantons_yes"] is not None and v["cantons_yes"] > v["cantons_no"]
print("double majority needed, voters in favour, cantons against:")
for v in feed:
    if v["double"] and voters(v) and not cantons(v):
        show(v)
print("double majority needed, cantons in favour, voters against:")
for v in feed:
    if v["double"] and cantons(v) and not voters(v):
        show(v)
print("only the voters count, passed although the cantons were against:")
for v in feed:
    if not v["double"] and voters(v) and v["cantons_yes"] is not None and not cantons(v):
        show(v)
print("the three closest results:")
for v in sorted(feed, key=lambda v: abs(v["yes"] - v["no"]) / (v["yes"] + v["no"]))[:3]:
    show(v)
print("an initiative, its counter-proposal and the tie-break question:")
for v in feed:
    if v["kind"] in (4, 5, 6):
        show(v)
print("the vote of failure mode 3:")
show(next(v for v in feed if v["id"] == "5960"))
verdict = lambda v: voters(v) and (cantons(v) or not v["double"])
plain = [v for v in feed if v["kind"] in (1, 2, 3)]
print(f"\nverdict by the rules == 'accepted' of the feed, kinds 1 to 3: "
      f"{sum(1 for v in plain if verdict(v) == v['accepted'])} of {len(plain)}")
