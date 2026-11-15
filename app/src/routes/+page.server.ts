// The start page's list of votes, written at build time (spec vote-list): the page's data holds
// only what an entry shows.
import type { Votes } from '../lib/vote-data.ts';
import { voteList } from '../lib/vote-list.ts';
import votesFile from '../../static/data/votes.json';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ years: voteList(votesFile as Votes) });
