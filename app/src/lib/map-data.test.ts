// Loading the map's data (spec result-map, "The map's data is loaded once" and "A map that
// cannot be loaded"), with a fake of the browser's fetch.
import { expect, test } from 'vitest';
import { createCharacteristicsLoader, createMapLoader } from './map-data.ts';

const URLS = { map: '/site/data/map.json', municipalities: '/site/data/municipalities.json' };

function fakeFetch(status: (url: string) => number = () => 200) {
  const requested: string[] = [];
  const fetcher = (url: string): Promise<Response> => {
    requested.push(url);
    return Promise.resolve(new Response(JSON.stringify({ url }), { status: status(url) }));
  };
  return { fetcher, requested };
}

test('two loads make one request per file', async () => {
  const { fetcher, requested } = fakeFetch();
  const load = createMapLoader(URLS, fetcher);
  const first = await load();
  const second = await load();
  expect(second).toBe(first);
  expect(first.map).toEqual({ url: URLS.map });
  expect(first.municipalities).toEqual({ url: URLS.municipalities });
  expect([...requested].sort()).toEqual([URLS.map, URLS.municipalities]);
});

test('a failed request rejects, naming the file', async () => {
  const { fetcher } = fakeFetch((url) => (url === URLS.map ? 404 : 200));
  const load = createMapLoader(URLS, fetcher);
  await expect(load()).rejects.toThrow(/\/site\/data\/map\.json: HTTP 404/);
});

const CHARACTERISTICS = '/site/data/characteristics.json';

test('the characteristics are requested once', async () => {
  const { fetcher, requested } = fakeFetch();
  const load = createCharacteristicsLoader(CHARACTERISTICS, fetcher);
  const first = await load();
  expect(await load()).toBe(first);
  expect(first).toEqual({ url: CHARACTERISTICS });
  expect(requested).toEqual([CHARACTERISTICS]);
});

test('a failed request of the characteristics rejects, naming the file', async () => {
  const { fetcher } = fakeFetch(() => 404);
  const load = createCharacteristicsLoader(CHARACTERISTICS, fetcher);
  await expect(load()).rejects.toThrow(/\/site\/data\/characteristics\.json: HTTP 404/);
});
