// Loading the map's shapes and the names of the municipalities in the browser (spec result-map,
// "The map's data is loaded once"; design of add-result-map, decisions 7 and 15). The page
// passes the addresses under the site's path; a test passes a fake of `fetch`.
import type { MapFile, Municipalities } from './vote-data.ts';

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
