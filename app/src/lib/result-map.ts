// What the map of a vote shows (spec result-map): the colour of each municipality from its
// yes and no votes, the legend, and the details of a municipality. The design of the change
// add-result-map gives the reasons (decisions 5, 6, 8 and 12).

export type Side = 'yes' | 'no';
// The class of the share of the side with more votes: 1 from 50% to below 60%, 2 from 60%, 3
// from 70%, 4 from 80%.
export type Step = 1 | 2 | 3 | 4;
export type Colouring = { readonly side: Side; readonly step: Step } | 'tie';

/** The side with more votes and the class of its share, compared in whole numbers. */
export function colouringOf(yes: number, no: number): Colouring {
  if (yes === no) return 'tie';
  const won = Math.max(yes, no);
  const total = yes + no;
  const step: Step =
    10 * won >= 8 * total ? 4 : 10 * won >= 7 * total ? 3 : 10 * won >= 6 * total ? 2 : 1;
  return { side: yes > no ? 'yes' : 'no', step };
}
