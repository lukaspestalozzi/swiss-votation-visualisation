// The comparison of two votes (spec vote-comparison), written at build time in each language: the
// votes it offers, each with what its page writes from its file, and the numbers of the Swiss
// abroad (design of add-vote-comparison, decision 4). The browser loads the votes' files of entries
// itself.
import { comparableVotes } from '../../../lib/comparison.ts';
import { LANGUAGES, textsOf } from '../../../lib/texts/index.ts';
import type { Municipalities, VoteFile, Votes } from '../../../lib/vote-data.ts';
import municipalitiesFile from '../../../../static/data/municipalities.json';
import votesFile from '../../../../static/data/votes.json';
import type { EntryGenerator, PageServerLoad } from './$types';

const listing = votesFile as Votes;
const swissAbroad = Object.values((municipalitiesFile as unknown as Municipalities).swissAbroad);
const files = import.meta.glob<VoteFile>('../../../../static/data/votes/*.json', {
  eager: true,
  import: 'default',
});
const fileOf = new Map(Object.values(files).map((file) => [file.id, file]));

// The comparison in each language (spec interface-languages).
export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));

export const load: PageServerLoad = async ({ parent }) => {
  const { lang } = await parent();
  return { votes: comparableVotes(listing, (id) => fileOf.get(id), textsOf(lang)), swissAbroad };
};
