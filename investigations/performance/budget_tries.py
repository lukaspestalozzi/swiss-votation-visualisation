# The budget tests' tries in Playwright's JSON reports (investigations/performance.md, M11): per
# budget test, its first tries, how many failed, its retries, and the longest frame of each first
# try, from the line "frames: N, longest X ms" that app/e2e/frames.ts prints.
# Usage: python3 -I budget_tries.py <report.json> [<report.json> ...]
# A report comes from: PLAYWRIGHT_JSON_OUTPUT_NAME=<file> pnpm --filter app exec playwright test --reporter=json
import json, re, statistics, sys


def specs_of(suite):
    yield from suite.get('specs', [])
    for child in suite.get('suites', []):
        yield from specs_of(child)


for path in sys.argv[1:]:
    report = json.load(open(path))
    stats = report['stats']
    print(f"{path.split('/')[-1]}: passed {stats['expected']}, flaky {stats['flaky']}, failed {stats['unexpected']}, "
          f"{stats['duration'] / 1000:.0f} s")
    tries = {}
    for suite in report['suites']:
        for spec in specs_of(suite):
            if 'budget' not in spec['title']:
                continue
            for test in spec['tests']:
                for result in test['results']:
                    out = ''.join(line.get('text', '') for line in result.get('stdout', []))
                    found = re.search(r'longest ([\d.]+) ms', out)
                    longest = float(found.group(1)) if found else None
                    tries.setdefault(spec['title'], []).append((result['retry'], result['status'], longest))
    for title, results in tries.items():
        first = [r for r in results if r[0] == 0]
        failed = [r[2] for r in first if r[1] != 'passed']
        retries = [r for r in results if r[0] > 0]
        longest = [r[2] for r in first if r[2] is not None]
        print(f"  {title[:45]}: first tries {len(first)}, failed {len(failed)} {failed}, retries {len(retries)}; "
              f"longest frame of a first try: median {statistics.median(longest):.1f} ms, "
              f"max {max(longest):.1f} ms")
