# The timeline inside the longest measurement window of a trace written by measure_clicks.cjs
# --trace (investigations/performance.md): the main thread's events and the marks in-<id> and
# out-<id> that begin and end each frame's measurement, in ms from the window's start.
# Usage: python3 timeline.py <dir outside the repo>/run-1.json
import json, sys
trace = json.load(open(sys.argv[1]))
ev = trace['traceEvents'] if isinstance(trace, dict) else trace
marks = {e['name']: e for e in ev if 'blink.user_timing' in e.get('cat', '') and e['name'][:3] in ('in-', 'out')}
wins = []
for name, e in marks.items():
    if name.startswith('in-') and 'out-' + name[3:] in marks:
        wins.append((marks['out-' + name[3:]]['ts'] - e['ts'], name[3:]))
wins.sort(reverse=True)
length, k = wins[0]
b, o = marks['in-' + k], marks['out-' + k]
print(f'window in-{k}: {length/1000:.1f} ms')
main = [e for e in ev if e.get('pid') == b['pid'] and e.get('tid') == b['tid']]
tops = [e for e in main if e.get('ph') == 'X' and e['name'] in ('ThreadControllerImpl::RunTask', 'Receive mojo message', 'RunTask') and e['ts'] + e.get('dur', 0) > b['ts'] - 500 and e['ts'] < o['ts'] + 500]
inner = [e for e in main if e.get('ph') == 'X' and e['name'] in ('EventDispatch', 'FireAnimationFrame', 'TimerFire', 'Paint', 'Layout', 'UpdateLayoutTree', 'Commit', 'FunctionCall', 'MajorGC', 'MinorGC', 'V8.GC_SCAVENGER', 'HitTest') and b['ts'] - 500 <= e['ts'] <= o['ts'] + 500]
points = [(m['ts'], 'MARK ' + n) for n, m in marks.items() if b['ts'] - 500 <= m['ts'] <= o['ts'] + 500]
rows = [(e['ts'], f"{e['name']} {e.get('dur',0)/1000:.1f}ms" + (f" [{e['args']['data'].get('type')}]" if e['name']=='EventDispatch' and 'data' in e.get('args',{}) else '')) for e in inner] + points
for ts, text in sorted(rows):
    print(f'{(ts - b["ts"])/1000:7.2f}  {text}')
print('top-level tasks:')
for e in sorted(tops, key=lambda e: e['ts']):
    print(f"{(e['ts'] - b['ts'])/1000:7.2f}  {e['name']} {e.get('dur',0)/1000:.1f}ms")
