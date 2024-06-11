/**
 * Filter key & value, which has "never" value
 *
 * @example
 * ```
 * type T0 = FilterNever<{ a: never; b: string }>, { b: string }>
 * // => {b: string}
 * ```
 */
export type FilterNever<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

/**
 * Replace substring
 * S: source string
 * From: substring to be replaced
 * To: substring to replace
 *
 * @example
 * ```
 * type T0 = Replace<"abcd", "bc", "-">;
 * // => "a-d"
 * ```
 */
export type Replace<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer P}${From}${infer R}` ? `${P}${To}${R}` : S;

/**
 * Replace all substring
 * S: source string
 * From: substring to be replaced
 * To: substring to replace
 *
 * @example
 * ```
 * type T0 = ReplaceAll<"aabaa", "aa", "-">;
 * // => "-b-"
 * ```
 */
export type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = From extends ""
  ? S
  : S extends `${infer P}${From}${infer R}`
    ? `${P}${To}${ReplaceAll<R, From, To>}`
    : S;

/**
 * Split string by delimiter
 * S: source string
 * Delimiter: delimiter to split
 *
 * @example
 * ```
 * type T0 = Split<"a/b/c", "/">;
 * // => ["a", "b", "c"]
 * ```
 */
export type Split<
  S extends string,
  Delimiter extends string,
> = S extends `${infer Head}${Delimiter}${infer Tail}`
  ? [Head, ...Split<Tail, Delimiter>]
  : S extends Delimiter
    ? []
    : [S];

/**
 * Extract string by prefix
 * T: source string
 * Prefix: prefix to extract
 *
 * @example
 * ```
 * type T0 = ExtractByPrefix<"p-a" | "p-b" | "c", "p-">;
 * // => "a" | "b"
 * ```
 */
export type ExtractByPrefix<
  T extends string,
  Prefix extends string,
> = T extends `${Prefix}${infer R}` ? R : never;
