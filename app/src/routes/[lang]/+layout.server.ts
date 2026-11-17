// The language of every page under it (spec interface-languages; design of
// add-interface-languages, decision 5): the first segment of the address. Any other value has no
// page; prerendering never meets one, since it follows only the pages' entries.
import { error } from '@sveltejs/kit';
import { isLanguage } from '../../lib/texts/index.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ params }) => {
  if (!isLanguage(params.lang)) error(404, `there is no language ${params.lang}`);
  return { lang: params.lang };
};
