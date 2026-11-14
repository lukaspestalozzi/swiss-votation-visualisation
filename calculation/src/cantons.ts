/** A canton of Switzerland and the weight of its vote in the majority of cantons. */
export interface Canton {
  /** The official two-letter abbreviation, for example `ZH`. */
  readonly abbreviation: string;
  /** The canton's number of cantonal votes (Federal Constitution, art. 142 para. 4). */
  readonly cantonalVotes: 1 | 0.5;
}

/**
 * The 26 cantons in the order of article 1 of the Federal Constitution. Obwalden, Nidwalden,
 * Basel-Stadt, Basel-Landschaft, Appenzell Ausserrhoden and Appenzell Innerrhoden have half a
 * cantonal vote each.
 */
export const CANTONS: readonly Canton[] = [
  { abbreviation: 'ZH', cantonalVotes: 1 },
  { abbreviation: 'BE', cantonalVotes: 1 },
  { abbreviation: 'LU', cantonalVotes: 1 },
  { abbreviation: 'UR', cantonalVotes: 1 },
  { abbreviation: 'SZ', cantonalVotes: 1 },
  { abbreviation: 'OW', cantonalVotes: 0.5 },
  { abbreviation: 'NW', cantonalVotes: 0.5 },
  { abbreviation: 'GL', cantonalVotes: 1 },
  { abbreviation: 'ZG', cantonalVotes: 1 },
  { abbreviation: 'FR', cantonalVotes: 1 },
  { abbreviation: 'SO', cantonalVotes: 1 },
  { abbreviation: 'BS', cantonalVotes: 0.5 },
  { abbreviation: 'BL', cantonalVotes: 0.5 },
  { abbreviation: 'SH', cantonalVotes: 1 },
  { abbreviation: 'AR', cantonalVotes: 0.5 },
  { abbreviation: 'AI', cantonalVotes: 0.5 },
  { abbreviation: 'SG', cantonalVotes: 1 },
  { abbreviation: 'GR', cantonalVotes: 1 },
  { abbreviation: 'AG', cantonalVotes: 1 },
  { abbreviation: 'TG', cantonalVotes: 1 },
  { abbreviation: 'TI', cantonalVotes: 1 },
  { abbreviation: 'VD', cantonalVotes: 1 },
  { abbreviation: 'VS', cantonalVotes: 1 },
  { abbreviation: 'NE', cantonalVotes: 1 },
  { abbreviation: 'GE', cantonalVotes: 1 },
  { abbreviation: 'JU', cantonalVotes: 1 },
];

/** The total of the cantonal votes of the given cantons. Halves add up exactly. */
export function totalCantonalVotes(cantons: readonly Canton[]): number {
  return cantons.reduce((total, canton) => total + canton.cantonalVotes, 0);
}
