// The reading guide (spec reading-guide), written at build time: its sources name the reference
// date of the list of municipalities and the year of the lakes from the map's data file.
import { formatDate } from '../../lib/format.ts';
import type { MapFile } from '../../lib/vote-data.ts';
import mapData from '../../../static/data/map.json';
import type { PageServerLoad } from './$types';

const map = mapData as unknown as MapFile;

export const load: PageServerLoad = () => ({
  mapDate: formatDate(map.referenceDate),
  lakesSet: map.lakesSet,
});
