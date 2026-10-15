/**
 * Refusals as data.
 *
 * Every formulab function refuses invalid input with a `RangeError` whose `message` is an English
 * sentence for developers. A consumer with a non-English UI cannot show that sentence, and must not
 * parse it: the facts in it — which input, which bound, what was given — are facts formulab already
 * holds when it throws. `InputRangeError` carries them as properties beside the unchanged message,
 * named and spelled like the refusals of the @iyulab calculation engines (`code`, `parameter`,
 * `min`, `max`, `exclusive_min`, `exclusive_max`, `got`), so one reader serves both.
 *
 * It is a `RangeError`, so `instanceof RangeError` and every existing message check still hold.
 */

/**
 * Why an input was refused. One vocabulary for the whole library (and shared with the @iyulab
 * engines), not one code per sentence: the code names the kind of refusal, the properties say
 * which input and which bound.
 */
export type InputErrorCode =
  /** A value lies outside the range the formula is defined on — see the bound properties. */
  | 'parameter_out_of_range'
  /** A number in the input is NaN or ±Infinity. */
  | 'value_not_finite'
  /** A list the function needs at least one entry in is empty. */
  | 'empty_input'
  /** A list has entries, but fewer than the calculation needs — `min` is the least count. */
  | 'insufficient_data';

/** The facts behind a refusal. Bounds are closed (`min`/`max`) or open (`exclusive_min`/`exclusive_max`). */
export interface InputErrorDetail {
  code: InputErrorCode;
  /** The refused input's name in the function's own argument (`thickness`, `cargo[2].weight`). */
  parameter?: string;
  min?: number;
  max?: number;
  exclusive_min?: number;
  exclusive_max?: number;
  /** The value that was given (a count, for `insufficient_data`). */
  got?: number;
}

/** A refused input, with the facts behind the refusal as properties. */
export class InputRangeError extends RangeError {
  readonly code: InputErrorCode;
  declare readonly parameter?: string;
  declare readonly min?: number;
  declare readonly max?: number;
  declare readonly exclusive_min?: number;
  declare readonly exclusive_max?: number;
  declare readonly got?: number;

  constructor(message: string, detail: InputErrorDetail) {
    super(message);
    this.name = 'RangeError';
    this.code = detail.code;
    // Only the facts that apply become properties (hence `declare` above: a class field would define
    // every one, as undefined), so a consumer can tell «no upper bound» from «max: undefined».
    if (detail.parameter !== undefined) this.parameter = detail.parameter;
    if (detail.min !== undefined) this.min = detail.min;
    if (detail.max !== undefined) this.max = detail.max;
    if (detail.exclusive_min !== undefined) this.exclusive_min = detail.exclusive_min;
    if (detail.exclusive_max !== undefined) this.exclusive_max = detail.exclusive_max;
    if (detail.got !== undefined) this.got = detail.got;
  }
}
