// The script of a page that redirects (spec interface-languages, "The address without a
// language"), run as the browser runs it, with a made-up browser.
import { expect, test } from 'vitest';
import { redirectScript } from './languages.ts';

const ADDRESSES = { de: '/x/de/votes/5960/', fr: '/x/fr/votes/5960/', it: '/x/it/votes/5960/' };

/** Run the script's very text, as the page holds it, with the browser's two globals it reads. */
function runScript(navigator: object, location: object): void {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- the test runs the very text the page holds
  const script = new Function('navigator', 'location', redirectScript(ADDRESSES)) as (
    navigator: object,
    location: object,
  ) => void;
  script(navigator, location);
}

/** Run the script in a browser that prefers `languages`; the addresses it replaces the page with. */
function redirectedTo(languages: readonly string[]): string[] {
  const replaced: string[] = [];
  runScript({ languages }, { replace: (address: string) => replaced.push(address) });
  return replaced;
}

test('a browser that prefers French: the French page', () => {
  expect(redirectedTo(['fr-CH'])).toEqual(['/x/fr/votes/5960/']);
});

test('the first of the three among the preferred languages: Italian before German', () => {
  expect(redirectedTo(['en-US', 'it-CH', 'de-CH'])).toEqual(['/x/it/votes/5960/']);
});

test('a browser that prefers none of the three: the German page', () => {
  expect(redirectedTo(['en-US'])).toEqual(['/x/de/votes/5960/']);
});

test('a browser that names no language: the German page', () => {
  expect(redirectedTo([])).toEqual(['/x/de/votes/5960/']);
});

test('a language counts by its part before the first "-": "frr" is not French', () => {
  expect(redirectedTo(['frr'])).toEqual(['/x/de/votes/5960/']);
});

test('the page is replaced, not followed: "back" skips the page that redirects', () => {
  const replaced: string[] = [];
  const assigned: string[] = [];
  const location = {
    replace: (address: string) => replaced.push(address),
    set href(address: string) {
      assigned.push(address);
    },
  };
  runScript({ languages: ['it'] }, location);
  expect(replaced).toEqual(['/x/it/votes/5960/']);
  expect(assigned).toEqual([]);
});
