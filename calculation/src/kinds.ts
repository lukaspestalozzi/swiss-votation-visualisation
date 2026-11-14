/** The kinds of national vote. The names are the calculation's own, not a source's codes. */
export type Kind =
  | 'popular-initiative'
  | 'mandatory-referendum'
  | 'optional-referendum'
  | 'initiative-with-counter-proposal'
  | 'counter-proposal'
  | 'tie-break-question';

/** The majorities a vote needs to pass. */
export type Majorities = 'voters' | 'voters-and-cantons';

/** The majorities a kind of vote needs (Federal Constitution, art. 139b and 140 to 142). */
export function majoritiesNeeded(kind: Kind): Majorities | 'not-calculated' {
  switch (kind) {
    case 'popular-initiative':
    case 'mandatory-referendum':
    case 'initiative-with-counter-proposal':
    case 'counter-proposal':
      return 'voters-and-cantons';
    case 'optional-referendum':
      return 'voters';
    case 'tie-break-question':
      return 'not-calculated';
  }
}
