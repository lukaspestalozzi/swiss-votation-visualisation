// The script of a page that redirects to the page in the browser's language (spec
// interface-languages, "The address without a language" and "The addresses of before"; design of
// add-interface-languages, decisions 2 to 4). It runs in the head, before anything shows, and
// replaces the page, so that "back" skips it. Nothing is stored: each visit chooses anew.
import type { Language } from './texts/index.ts';

/**
 * The script for a page whose addresses in the three languages are `addresses`: it opens the
 * first of the three among the browser's preferred languages, a language counting by its part
 * before the first "-" ("fr-CH" is French), and German without one of them.
 */
export function redirectScript(addresses: Readonly<Record<Language, string>>): string {
  return (
    `(function(){var a=${JSON.stringify(addresses)};` +
    'var p=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];' +
    'for(var i=0;i<p.length;i++){var l=String(p[i]).split("-")[0].toLowerCase();' +
    'if(Object.prototype.hasOwnProperty.call(a,l)){location.replace(a[l]);return}}' +
    'location.replace(a.de)})();'
  );
}
