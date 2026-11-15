// Dates and numbers as the screen writes them (spec vote-list, "How dates and numbers are
// written"). These functions do not use the locale data of the machine or the browser, so a page
// reads the same wherever it is built or shown.

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

const MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

/** A date of the data files (2016-02-28) as day, German month and year: 28. Februar 2016. */
export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || month === undefined) {
    throw new RangeError(`${date} is not a date of the form 2016-02-28`);
  }
  return `${String(Number(match[3]))}. ${month} ${match[1]}`;
}
