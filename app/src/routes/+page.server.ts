// The start page's list of votes, written at build time (spec vote-list): the page's data holds
// only what an entry shows.
import { textsOf, type Language } from '../lib/texts/index.ts';
import type { Votes } from '../lib/vote-data.ts';
import { voteList } from '../lib/vote-list.ts';
import votesFile from '../../static/data/votes.json';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  const lang: Language = 'de';
  return { lang, years: voteList(votesFile as Votes, textsOf(lang)) };
};
