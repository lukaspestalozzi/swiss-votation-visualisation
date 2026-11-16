# Every measurement window over 16 ms in the traces written by measure_clicks.cjs --trace
# (investigations/performance.md): whether a click and the click's frame lie inside it, and how
# long the window's own frame took, from its input to the first commit after it.
# Usage: python3 windows.py <dir outside the repo>
import json, sys, glob
for path in sorted(glob.glob(sys.argv[1] + '/run-*.json')):
    trace = json.load(open(path))
    ev = trace['traceEvents'] if isinstance(trace, dict) else trace
    marks = {e['name']: e for e in ev if 'blink.user_timing' in e.get('cat', '') and e['name'][:3] in ('in-', 'out')}
    b0 = next(iter(marks.values()))
    main = [e for e in ev if e.get('pid') == b0['pid'] and e.get('tid') == b0['tid'] and e.get('ph') == 'X']
    commits = sorted(e['ts'] for e in main if e['name'] == 'Commit')
    clicks = sorted(e['ts'] for e in main if e['name'] == 'EventDispatch' and e.get('args', {}).get('data', {}).get('type') == 'click')
    longs = 0; own = []; ok = 0
    for name, b in marks.items():
        if not name.startswith('in-') or 'out-' + name[3:] not in marks: continue
        o = marks['out-' + name[3:]]
        if (o['ts'] - b['ts']) / 1000 <= 16: continue
        longs += 1
        first_commit = next(c for c in commits if c > b['ts'])
        own.append((first_commit - b['ts']) / 1000)
        click_inside = any(b['ts'] < c < o['ts'] for c in clicks)
        commit_after_click = any(c > max([x for x in clicks if b['ts'] < x < o['ts']] or [o['ts']]) and c < o['ts'] for c in commits)
        ok += click_inside and commit_after_click
    span = f"{min(own):.1f} to {max(own):.1f} ms" if own else "none"
    print(f"{path.split('/')[-1]}: windows over 16 ms: {longs}, with a click and the click's frame inside: {ok}, "
          f"own frame (to its first commit): {span}")
