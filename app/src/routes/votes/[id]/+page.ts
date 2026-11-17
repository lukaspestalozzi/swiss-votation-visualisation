// A vote's address before the site had languages opens the vote's page in the browser's language
// (spec interface-languages, "The addresses of before"). The page loads no script of the app.
import { error } from '@sveltejs/kit';
import type { Votes } from '../../../lib/vote-data.ts';
import votesFile from '../../../../static/data/votes.json';
import type { EntryGenerator, PageLoad } from './$types';

const listing = votesFile as Votes;

export const csr = false;

export const entries: EntryGenerator = () => listing.votes.map((vote) => ({ id: String(vote.id) }));

export const load: PageLoad = ({ params }) => {
  if (!listing.votes.some((vote) => String(vote.id) === params.id)) {
    error(404, `there is no vote ${params.id}`);
  }
  return { id: params.id };
};
