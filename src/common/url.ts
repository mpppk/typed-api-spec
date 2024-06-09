import { ParseQueryString } from "./query-string";
import { ExtractByPrefix, Split } from "./type";

type ExtractParams<T extends string> = ExtractByPrefix<T, ":">;
export type ParseUrlParams<T extends string> = ExtractParams<
  Split<T, "/">[number]
>;

export type UrlSchema = "http" | "https" | "about" | "blob" | "data" | "file";
type UrlPrefix = `${UrlSchema}://` | "";
export type UrlPrefixPattern = `${UrlPrefix}${string}`;
export type ToUrlParamPattern<T> = T extends `${infer O}:${infer R}`
  ? R extends `${string}/${infer L}`
    ? `${O}${string}/${ToUrlParamPattern<L>}`
    : `${O}${string}`
  : T;

export type ToUrlPattern<T> = T extends `${infer O}?${infer R}`
  ? `${ToUrlParamPattern<O>}?${ToUrlPattern<R>}`
  : ToUrlParamPattern<T>;

export type MatchedPatterns<T extends string, Patterns extends string> = keyof {
  [K in Patterns as T extends ToUrlPattern<K> ? K : never]: true;
};
export type ParseHostAndPort<T> = T extends `${infer Host}:${infer Port}`
  ? Port extends `${number}`
    ? { host: Host; port: Port }
    : never
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
