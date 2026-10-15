/**
 * Warnings as data.
 *
 * A function that returns a result it has doubts about lists them in `warnings: string[]` — English
 * sentences for developers. `diagnostics` carries the same notes, one for one and in the same order,
 * as data a consumer can translate: a `code` naming the kind of note and the facts behind it, named
 * like the refusal facts (`parameter`, `got`, `min`, `max`). `min` and `max` are the bound the value
 * crossed — a recommended minimum, a regulatory limit, an action level — whichever the code says.
 */

/** Why a result carries a note. One code per kind of judgement, not per sentence. */
export type DiagnosticCode =
  // metal — bending
  /** The inside radius is below the material's recommended minimum bend radius (`min`). */
  | 'bend_radius_below_minimum'
  /** A bend this close to 180° (above `max`) springs back unpredictably. */
  | 'bend_angle_extreme'
  // metal — deep drawing
  /** The draw ratio d/D is below the safe single-draw limit (`min`) — risk of fracture. */
  | 'draw_ratio_below_limit'
  /** The draw ratio is within the limit but close to it — careful process control, anneal between draws. */
  | 'draw_ratio_marginal'
  /** The part needs `count` draws. */
  | 'multiple_draws_required'
  /** The friction coefficient is above `max` — lubricate to prevent galling. */
  | 'friction_high'
  /** Blank holder pressure above `max` — excessive thinning. */
  | 'blank_holder_pressure_high'
  /** Blank holder pressure below `min` — wrinkling. */
  | 'blank_holder_pressure_low'
  // safety — confined space (`parameter` names the reading; `name` a custom gas)
  /** Oxygen below `min` (19.5 %). */
  | 'oxygen_deficient'
  /** Oxygen above `max` (23.5 %). */
  | 'oxygen_enriched'
  /** A reading above its action level or exposure limit (`max`) — caution. */
  | 'gas_elevated'
  /** A reading above its exposure limit (`max`) — danger. */
  | 'gas_above_limit'
  /** A reading at or above the IDLH concentration (`max`). */
  | 'gas_idlh'
  // safety — fall protection
  /** Free fall above the limit (`max`, 1.8 m). */
  | 'free_fall_exceeds_limit'
  /** Deceleration distance above the limit (`max`, 1.07 m). */
  | 'deceleration_exceeds_limit'
  /** The anchor leaves `got` metres less than the required clearance above the obstacle. */
  | 'clearance_insufficient'
  // safety — ladders
  /** The ladder is no longer than the height (or the base distance) it must span — `parameter` says which. */
  | 'ladder_too_short'
  /** The angle is below the compliant range (`min`) — the foot may slide out. */
  | 'ladder_angle_too_shallow'
  /** The angle is above the compliant range (`max`) — the ladder may tip backwards. */
  | 'ladder_angle_too_steep'
  /** The ladder may not extend far enough above the landing. */
  | 'ladder_extension_short'
  // logistics — pallet loading
  /** More box types than supported (`max`); the extra ones were ignored. */
  | 'box_types_truncated'
  /** `count` boxes could not be placed. */
  | 'boxes_unplaced'
  /** The load's centre of gravity is off-centre. */
  | 'center_of_gravity_off_center'
  /** The load is near the maximum payload. */
  | 'payload_near_maximum'
  // food — water activity (`min` = the aw above which the organism grows)
  /** Elevated temperature speeds microbial growth. */
  | 'temperature_elevated'
  /** Pathogenic bacteria can grow. */
  | 'pathogen_growth_possible'
  /** Yeasts and molds can grow. */
  | 'yeast_mold_growth_possible'
  /** Molds can grow. */
  | 'mold_growth_possible'
  /** Xerophilic fungi can grow. */
  | 'xerophilic_growth_possible';

/** One note on a result, as data. */
export interface Diagnostic {
  code: DiagnosticCode;
  /** The input or reading the note is about, by its name in the function's argument. */
  parameter?: string;
  /** The value that crossed the bound. */
  got?: number;
  min?: number;
  max?: number;
  /** A count the note states (draws needed, boxes left over). */
  count?: number;
  /** A name the caller gave (a custom gas). */
  name?: string;
}

/** A result's notes, kept in step: each `add` appends the sentence and its data together. */
export class Notes {
  readonly warnings: string[] = [];
  readonly diagnostics: Diagnostic[] = [];

  add(message: string, diagnostic: Diagnostic): void {
    this.warnings.push(message);
    this.diagnostics.push(diagnostic);
  }
}
