// A vote's page, written at build time for every vote of the list (spec verdicts): its result is
// calculated here, so the page holds it and the browser loads no file of entries. For its map
// (spec result-map) and its selection (spec limits) it holds each entry's canton, yes and no
// votes, checked against the map's data, and the majorities the vote needs; the browser loads the
// shapes themselves.
import { error } from '@sveltejs/kit';
import { majoritiesNeeded } from 'calculation';
import { voteEntriesOf } from '../../../../lib/result-map.ts';
import { LANGUAGES, textsOf } from '../../../../lib/texts/index.ts';
import type { MapFile, Municipalities, VoteFile, Votes } from '../../../../lib/vote-data.ts';
import { votePage } from '../../../../lib/vote-page.ts';
import mapData from '../../../../../static/data/map.json';
import municipalitiesFile from '../../../../../static/data/municipalities.json';
import votesFile from '../../../../../static/data/votes.json';
import type { EntryGenerator, PageServerLoad } from './$types';

const listing = votesFile as Votes;
// JSON imports are typed from their content, with the pairs as plain arrays.
const onTheMap = (mapData as unknown as MapFile).municipalities.map(([number]) => number);
const swissAbroad = Object.values((municipalitiesFile as unknown as Municipalities).swissAbroad);
// Read lazily: each page reads its own vote's file.
const files = new Map(
  Object.entries(
    import.meta.glob<VoteFile>('../../../../../static/data/votes/*.json', { import: 'default' }),
  ),
);

// Every vote in each language (spec interface-languages).
export const entries: EntryGenerator = () =>
  LANGUAGES.flatMap((lang) => listing.votes.map((vote) => ({ lang, id: String(vote.id) })));

export const load: PageServerLoad = async ({ params, parent }) => {
  const vote = listing.votes.find((vote) => String(vote.id) === params.id);
  if (vote === undefined) error(404, `there is no vote ${params.id}`);
  const loader = files.get(`../../../../../static/data/votes/${params.id}.json`);
  const file = loader === undefined ? undefined : await loader();
  const { lang } = await parent();
  const page = votePage(vote, file, textsOf(lang));
  // votePage has refused a vote without its file; a tie-break question gets no map.
  const entries =
    file === undefined || page.judged === null ? null : voteEntriesOf(file, onTheMap, swissAbroad);
  const majorities = majoritiesNeeded(vote.kind);
  // The vote's day decides which characteristics apply (spec characteristics).
  return { ...page, entries, majorities, voteDate: vote.date };
};
