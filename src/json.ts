// from https://zenn.dev/mizchi/articles/typed-fetch-magic
export type TypedString<T> = string & { _: T };

export type JSON$stringifyT = <T>(
  data: T,
  replacer?: undefined,
  space?: number | string | undefined,
) => TypedString<T>;