export type FilterNever<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

export type Replace<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer P}${From}${infer R}` ? `${P}${To}${R}` : S;

export type Split<
  S extends string,
  Delimiter extends string,
> = S extends `${infer Head}${Delimiter}${infer Tail}`
  ? [Head, ...Split<Tail, Delimiter>]
  : S extends Delimiter
    ? []
    : [S];

export type ExtractByPrefix<
  T extends string,
  Prefix extends string,
> = T extends `${Prefix}${infer R}` ? R : never;
