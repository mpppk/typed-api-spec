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

export type StrictProperty<T, TExpected> =
  Exclude<keyof T, keyof TExpected> extends never ? T : never;

export type UndefinedTo<T, U> = T extends undefined ? U : T;

/**
 * Compare two numbers
 *
 * @example
 * ```
 * type T0 = IsEqualNumber<1, 1>; // => true
 * type T1 = IsEqualNumber<1, 2>; // => false
 * ```
 */
export type IsEqualNumber<
  A extends number,
  B extends number,
> = `${A}` extends `${B}` ? (`${B}` extends `${A}` ? true : false) : false;

/**
 * Count character in string
 *
 * @example
 * ```
 * type CountA = CountChar<"banana", "a">; // 3
 * type CountB = CountChar<"banana", "b">; // 1
 * type CountN = CountChar<"banana", "n">; // 2
 * type CountX = CountChar<"banana", "x">; // 0
 * ```
 */
export type CountChar<
  S extends string,
  C extends string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Count extends any[] = [],
> = S extends `${infer First}${infer Rest}`
  ? First extends C
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CountChar<Rest, C, [any, ...Count]>
    : CountChar<Rest, C, Count>
  : Count["length"];

/**
 * Check if two strings have the same number of slashes
 *
 * @example
 * ```
 * type T0 = SameSlashNum<`/${string}/b`, `/aaa/b`>; // true
 * type T1 = SameSlashNum<`/${string}/b`, `/aaa`>; // false
 * ```
 */
export type SameSlashNum<P1 extends string, P2 extends string> = IsEqualNumber<
  CountChar<P1, "/">,
  CountChar<P2, "/">
>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type IsAllOptional<T> = {} extends T ? true : false;
