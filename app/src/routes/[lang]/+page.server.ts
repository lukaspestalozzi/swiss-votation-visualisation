// The start page's list of votes, written at build time (spec vote-list): the page's data holds
// only what an entry shows.
import { LANGUAGES, textsOf } from '../../lib/texts/index.ts';
import type { Votes } from '../../lib/vote-data.ts';
import { voteList } from '../../lib/vote-list.ts';
import votesFile from '../../../static/data/votes.json';
import type { EntryGenerator, PageServerLoad } from './$types';

// The start page in each language (spec interface-languages).
export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));

export const load: PageServerLoad = async ({ parent }) => {
  const { lang } = await parent();
  return { years: voteList(votesFile as Votes, textsOf(lang)) };
};
