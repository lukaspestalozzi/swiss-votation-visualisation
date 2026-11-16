// The loaders of the files a vote's page loads in the browser, one for every vote's page, so that
// each file is requested once per visit: the map's shapes and the names, and the characteristics
// apart, which the map does not wait for and the panel and the limits share (design of
// add-limits, decision 21).
import { asset } from '$app/paths';
import { createCharacteristicsLoader, createMapLoader } from '../../../lib/map-data.ts';

export const loadMap = createMapLoader(
  { map: asset('data/map.json'), municipalities: asset('data/municipalities.json') },
  (url) => fetch(url),
);

export const loadCharacteristics = createCharacteristicsLoader(
  asset('data/characteristics.json'),
  (url) => fetch(url),
);
