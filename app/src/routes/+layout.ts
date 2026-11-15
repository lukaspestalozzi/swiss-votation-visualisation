// Every page is written as a file at build time: the site needs no server of its own.
export const prerender = true;

// Every page is written as `<path>/index.html` (`votes/5960/index.html`), so that no page shares
// its name with a directory: a vote's data for client-side navigation is in `votes/5960/` too, and
// a static host may answer `/votes/5960` from either. Its address is `/votes/5960/`.
export const trailingSlash = 'always';
