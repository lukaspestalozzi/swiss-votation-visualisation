// The language of every page in its markup (spec interface-languages; design of
// add-interface-languages, decision 6): app.html writes `lang="%lang%"`, and this hook puts in the
// page's language while the page is written, prerendering included. A page without a language
// in its address, one that redirects, is German; its links name their own languages.
import type { Handle } from '@sveltejs/kit/hooks';
import { isLanguage } from './lib/texts/index.ts';

export const handle: Handle = ({ event, resolve }) => {
  const segment = event.params.lang;
  const lang = segment !== undefined && isLanguage(segment) ? segment : 'de';
  return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
};
