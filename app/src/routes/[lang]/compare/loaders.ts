// The loader of the votes' files of entries, one for the comparison page, so that each file is
// requested once per visit (spec vote-comparison, "Loading the votes"; design of
// add-vote-comparison, decision 3). The characteristics come from the vote pages' loader, which
// the two pages share.
import { asset } from '$app/paths';
import type { AssetPath } from '$app/types';
import { createEntriesLoader } from '../../../lib/map-data.ts';

export const loadEntries = createEntriesLoader(
  // Every vote of the list has its file, or the build fails (spec verdicts, "The page holds its
  // result"), so the name of any vote the page offers is one of the site's files.
  (id) => asset(`data/votes/${String(id)}.json` as AssetPath),
  (url) => fetch(url),
);
