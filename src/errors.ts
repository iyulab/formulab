/**
 * Refusals as data.
 *
 * Every formulab function refuses invalid input with a `RangeError` whose `message` is an English
 * sentence for developers. A consumer with a non-English UI cannot show that sentence, and must not
 * parse it: the facts in it — which input, which bound, what was given — are facts formulab already
 * holds when it throws. `inputRangeError()` attaches them to the `RangeError` as properties beside the
 * unchanged message, named and spelled like the refusals of the @iyulab calculation engines (`code`,
 * `parameter`, `min`, `max`, `exclusive_min`, `exclusive_max`, `got`), so one reader serves both.
 *
 * The error stays a plain `RangeError` — same prototype, same message — and the facts are own,
 * read-only and non-enumerable, like `message` and `cause`. So it compares, prints and serializes as the
 * error it replaced: a consumer that expects `new RangeError(message)` is unaffected, and one that wants
 * the facts reads `error.code`.
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
  | 'insufficient_data'
  /** A name or choice the function does not know (a material, a shape, a table key) — `got` is what was given. */
  | 'unknown_option'
  /** Lists that must pair up differ in length — `expected` is the length they must match, `got` this one's. */
  | 'dimension_mismatch';

/** The facts behind a refusal. Bounds are closed (`min`/`max`) or open (`exclusive_min`/`exclusive_max`). */
export interface InputErrorDetail {
  code: InputErrorCode;
  /** The refused input's name in the function's own argument (`thickness`, `cargo[2].weight`). */
  parameter?: string;
  min?: number;
  max?: number;
  exclusive_min?: number;
  exclusive_max?: number;
  /** The value that was given (a count, for `insufficient_data` and `dimension_mismatch`; the name, for `unknown_option`). */
  got?: number | string;
  /** The length a list must have, for `dimension_mismatch`. */
  expected?: number;
}

/** A `RangeError` carrying the facts behind the refusal (what `inputRangeError()` returns). */
export type InputRangeError = RangeError & Readonly<InputErrorDetail>;

/**
 * A `RangeError` with `message`, carrying `detail` as non-enumerable properties. Only the facts that
 * apply are set, so a consumer can tell «no upper bound» from «max: undefined».
 */
export function inputRangeError(message: string, detail: InputErrorDetail): InputRangeError {
  const error = new RangeError(message);
  for (const [key, value] of Object.entries(detail)) {
    if (value !== undefined) Object.defineProperty(error, key, { value, enumerable: false });
  }
  return error as InputRangeError;
}
