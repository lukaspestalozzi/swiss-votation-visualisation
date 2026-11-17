// The reading guide (spec reading-guide), written at build time: its sources name the reference
// date of the list of municipalities and the year of the lakes from the map's data file.
import { formatDate } from '../../../lib/format.ts';
import { LANGUAGES, textsOf } from '../../../lib/texts/index.ts';
import type { MapFile } from '../../../lib/vote-data.ts';
import mapData from '../../../../static/data/map.json';
import type { EntryGenerator, PageServerLoad } from './$types';

const map = mapData as unknown as MapFile;

// The guide in each language (spec interface-languages).
export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));

export const load: PageServerLoad = async ({ parent }) => {
  const { lang } = await parent();
  return { mapDate: formatDate(map.referenceDate, textsOf(lang)), lakesSet: map.lakesSet };
};
