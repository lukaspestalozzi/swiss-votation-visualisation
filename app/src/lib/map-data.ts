// Loading the map's shapes, the names of the municipalities and their characteristics in the
// browser (spec result-map, "The map's data is loaded once"; design of add-result-map, decisions
// 7 and 15, and of add-characteristics, decision 13). The page passes the addresses under the
// site's path; a test passes a fake of `fetch`.
import type { CharacteristicsFile, MapFile, Municipalities, VoteFile } from './vote-data.ts';

export interface MapSources {
  readonly map: MapFile;
  readonly municipalities: Municipalities;
}

export interface MapUrls {
  readonly map: string;
  readonly municipalities: string;
}

// The browser's fetch, as the loader uses it.
type Fetch = (url: string) => Promise<Response>;

async function json(url: string, fetcher: Fetch): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${String(response.status)}`);
  return response.json();
}

/** A loader that requests the two files on its first call and gives the same answer after. */
export function createMapLoader(urls: MapUrls, fetcher: Fetch): () => Promise<MapSources> {
  let loading: Promise<MapSources> | undefined;
  return () => {
    loading ??= Promise.all([json(urls.map, fetcher), json(urls.municipalities, fetcher)]).then(
      ([map, municipalities]) => ({
        map: map as MapFile,
        municipalities: municipalities as Municipalities,
      }),
    );
    return loading;
  };
}

/**
 * A loader of the characteristics, apart from the map's, so that the map does not wait for
 * them: it requests the file on its first call and gives the same answer after.
 */
export function createCharacteristicsLoader(
  url: string,
  fetcher: Fetch,
): () => Promise<CharacteristicsFile> {
  let loading: Promise<CharacteristicsFile> | undefined;
  return () => {
    loading ??= json(url, fetcher).then((file) => file as CharacteristicsFile);
    return loading;
  };
}

/**
 * A loader of the votes' files of entries, which the comparison of two votes calculates from in
 * the browser (spec vote-comparison, "Loading the votes"; design of add-vote-comparison, decision
 * 3): it requests a vote's file, at `urlOf` its id, on the first call for it and gives the same
 * answer after.
 */
export function createEntriesLoader(
  urlOf: (id: number) => string,
  fetcher: Fetch,
): (id: number) => Promise<VoteFile> {
  const loading = new Map<number, Promise<VoteFile>>();
  return (id) => {
    let file = loading.get(id);
    if (file === undefined) {
      file = json(urlOf(id), fetcher).then((answer) => answer as VoteFile);
      loading.set(id, file);
    }
    return file;
  };
}
