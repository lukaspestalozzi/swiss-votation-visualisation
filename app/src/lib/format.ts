// Dates and numbers as the screen writes them (spec vote-list, "How dates and numbers are
// written"). These functions do not use the locale data of the machine or the browser, so a page
// reads the same wherever it is built or shown.
import type { Texts } from './texts/index.ts';

/** A whole number from zero, its digits grouped by three with an apostrophe: 1'609'152. */
export function formatCount(count: number): string {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError(`${String(count)} is not a whole number from zero`);
  }
  return String(count).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/**
 * The share of `part` in `whole` as percent with two decimals: 49.16%. It is rounded half away
 * from zero, in whole numbers, so that no binary fraction tips it. Without a whole there is no
 * share, written "–".
 */
export function formatShare(part: number, whole: number): string {
  formatCount(part);
  formatCount(whole);
  if (part > whole) {
    throw new RangeError(`${String(part)} is more than ${String(whole)}`);
  }
  if (whole === 0) {
    return '–';
  }
  const hundredths = Math.floor((2 * part * 10000 + whole) / (2 * whole));
  return `${String(Math.floor(hundredths / 100))}.${String(hundredths % 100).padStart(2, '0')}%`;
}

/**
 * The quotient of two whole numbers with a number of decimals, its whole part grouped as a
 * count is: 4'320, 0.65, 2.519. It is rounded half away from zero, in whole numbers, like a
 * share. Without a whole there is no quotient, written "–".
 */
export function formatQuotient(part: number, whole: number, decimals: number): string {
  formatCount(part);
  formatCount(whole);
  if (whole === 0) {
    return '–';
  }
  return formatUnits(quotientUnits(part, whole, decimals), decimals);
}

/**
 * The quotient of two whole numbers, the whole above zero, as a whole number of units of its
 * last decimal: 131 / 52 with 3 decimals is 2519 (2.519). It is rounded half away from zero, in
 * whole numbers.
 */
export function quotientUnits(part: number, whole: number, decimals: number): number {
  formatCount(part);
  formatCount(whole);
  if (whole === 0) {
    throw new RangeError(`${String(part)} / 0 has no units`);
  }
  const scale = 10 ** decimals;
  if (!Number.isSafeInteger(2 * part * scale)) {
    throw new RangeError(`${String(part)} with ${String(decimals)} decimals is too large`);
  }
  return Math.floor((2 * part * scale + whole) / (2 * whole));
}

/**
 * A whole number of units of the last decimal, written with that many decimals and its whole
 * part grouped as a count is: 1998 with 2 decimals is 19.98. A limit's bounds are such numbers
 * (design of add-limits, decision 16).
 */
export function formatUnits(units: number, decimals: number): string {
  formatCount(units);
  const scale = 10 ** decimals;
  const written = formatCount(Math.floor(units / scale));
  if (decimals === 0) {
    return written;
  }
  return `${written}.${String(units % scale).padStart(decimals, '0')}`;
}

/** Cantonal votes, whole or with a half: 16½, ½, 10. */
export function formatCantonalVotes(cantonalVotes: number): string {
  const halves = cantonalVotes * 2;
  if (!Number.isSafeInteger(halves) || halves < 0) {
    throw new RangeError(`${String(cantonalVotes)} is not a number of cantonal votes`);
  }
  const whole = Math.floor(halves / 2);
  if (halves % 2 === 0) {
    return String(whole);
  }
  return whole === 0 ? '½' : `${String(whole)}½`;
}

/**
 * A date of the data files (2016-02-28) as day, month and year in the language of `t`:
 * 28. Februar 2016.
 */
export function formatDate(date: string, t: Texts): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const month = match ? t.MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || month === undefined) {
    throw new RangeError(`${date} is not a date of the form 2016-02-28`);
  }
  return t.date(Number(match[3]), month, Number(match[1]));
}
