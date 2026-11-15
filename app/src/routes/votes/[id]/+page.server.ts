// A vote's page, written at build time for every vote of the list (spec verdicts): its result is
// calculated here, so the page holds it and the browser loads no entries.
import { error } from '@sveltejs/kit';
import type { VoteFile, Votes } from '../../../lib/vote-data.ts';
import { votePage } from '../../../lib/vote-page.ts';
import votesFile from '../../../../static/data/votes.json';
import type { EntryGenerator, PageServerLoad } from './$types';

const listing = votesFile as Votes;
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
  const file = files.get(`../../../../static/data/votes/${params.id}.json`);
  return votePage(vote, file === undefined ? undefined : await file());
};
