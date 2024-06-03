import { ParseQueryString } from "./query-string";
import { ApiEndpoints } from "./spec";

export type ParseUrlParams<T> = T extends `${string}:${infer R}`
  ? R extends `${infer P}/${infer L}`
    ? P | ParseUrlParams<L>
    : R
  : never;

export type UrlSchema = "http" | "https" | "about" | "blob" | "data" | "file";
type UrlPrefix = `${UrlSchema}://` | "";
export type OriginPattern = `${UrlPrefix}${string}`;
export type ToUrlParamPattern<T> = T extends `${infer O}:${infer R}`
  ? R extends `${string}/${infer L}`
    ? `${O}${string}/${ToUrlParamPattern<L>}`
    : `${O}${string}`
  : T;

type KV<
  M extends Record<string, string>,
  T extends string,
> = T extends `${infer K}=${infer V}`
  ? K extends keyof M
    ? V extends M[K]
      ? `${K}=${M[K]}`
      : never
    : never
  : never;
export type UrlQueryPattern<
  M extends Record<string, string>,
  T extends string,
> = T extends `${infer O}&${infer R}`
  ? `${KV<M, O>}&${UrlQueryPattern<M, R>}`
  : KV<M, T>;
export type UrlPattern<
  M extends Record<string, string>,
  T extends string,
> = T extends `${infer O}?${infer R}`
  ? `${ToUrlParamPattern<O>}?${UrlQueryPattern<M, R>}`
  : ToUrlParamPattern<T>;

export type ToUrlPattern<T> = T extends `${infer O}?${infer R}`
  ? `${ToUrlParamPattern<O>}?${ToUrlPattern<R>}`
  : ToUrlParamPattern<T>;

export type MatchedPatterns<E extends ApiEndpoints, T extends string> = keyof {
  [K in keyof E as T extends ToUrlPattern<K> ? K : never]: true;
};

type ParseHostAndPort<T> =
  T extends `${infer Host}:${infer Port extends `${number}`}`
    ? { host: Host; port: Port }
    : { host: T; port: undefined };
export type ParseOrigin<T> =
  T extends `${infer S extends UrlSchema}://${infer Rest}`
    ? // URL Schemaを含むケース
      Rest extends `${infer Prefix}/${infer Suffix}`
      ? ParseHostAndPort<Prefix> & { schema: S; path: `/${Suffix}` }
      : ParseHostAndPort<Rest> & { schema: S; path: `` }
    : // URL Schemaを含まないケース
      T extends string
      ? { schema: undefined; host: undefined; port: undefined; path: T }
      : never;

type SplitUrlAndQueryString<S extends string> =
  S extends `${infer URL}?${infer QS}`
    ? { url: URL; qs: QS }
    : { url: S; qs: never };

export type ParseURL<T extends string> = ParseOrigin<
  SplitUrlAndQueryString<T>["url"]
> & {
  query: SplitUrlAndQueryString<T>["qs"] extends string
    ? ParseQueryString<SplitUrlAndQueryString<T>["qs"]>
    : Record<string, never>;
};
