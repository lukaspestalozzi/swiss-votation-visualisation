// A vote's page, written at build time for every vote of the list (spec verdicts): its result is
// calculated here, so the page holds it and the browser loads no entries. For its map (spec
// result-map) it holds each municipality's yes and no votes, checked against the map's data; the
// browser loads the shapes themselves.
import { error } from '@sveltejs/kit';
import { mapFiguresOf } from '../../../lib/result-map.ts';
import type { MapFile, Municipalities, VoteFile, Votes } from '../../../lib/vote-data.ts';
import { votePage } from '../../../lib/vote-page.ts';
import mapData from '../../../../static/data/map.json';
import municipalitiesFile from '../../../../static/data/municipalities.json';
import votesFile from '../../../../static/data/votes.json';
import type { EntryGenerator, PageServerLoad } from './$types';

const listing = votesFile as Votes;
// JSON imports are typed from their content, with the pairs as plain arrays.
const onTheMap = (mapData as unknown as MapFile).municipalities.map(([number]) => number);
const swissAbroad = Object.values((municipalitiesFile as unknown as Municipalities).swissAbroad);
// Read lazily: each page reads its own vote's file.
const files = new Map(
  Object.entries(
    import.meta.glob<VoteFile>('../../../../static/data/votes/*.json', { import: 'default' }),
  ),
);

export const entries: EntryGenerator = () => listing.votes.map((vote) => ({ id: String(vote.id) }));

export const load: PageServerLoad = async ({ params }) => {
  const vote = listing.votes.find((vote) => String(vote.id) === params.id);
  if (vote === undefined) error(404, `there is no vote ${params.id}`);
  const loader = files.get(`../../../../static/data/votes/${params.id}.json`);
  const file = loader === undefined ? undefined : await loader();
  const page = votePage(vote, file);
  // votePage has refused a vote without its file; a tie-break question gets no map.
  const map =
    file === undefined || page.judged === null ? null : mapFiguresOf(file, onTheMap, swissAbroad);
  // The vote's day decides which characteristics apply (spec characteristics).
  return { ...page, map, voteDate: vote.date };
};
