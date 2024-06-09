import { Equal, Expect } from "./type-test";
import {
  MatchedPatterns,
  ParseHostAndPort,
  ParseOrigin,
  ParseURL,
  ParseUrlParams,
  ToUrlParamPattern,
  ToUrlPattern,
} from "./url";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ParseUrlParamsTestCases = [
  // @ts-expect-error undefined is not a string
  Expect<Equal<ParseUrlParams<undefined>, never>>,
  Expect<Equal<ParseUrlParams<"">, never>>,
  Expect<Equal<ParseUrlParams<"">, never>>,
  Expect<Equal<ParseUrlParams<":a">, "a">>,
  Expect<Equal<ParseUrlParams<"/:a">, "a">>,
  Expect<Equal<ParseUrlParams<"/:a/:b">, "a" | "b">>,
  Expect<Equal<ParseUrlParams<"/a/:b">, "b">>,

  Expect<Equal<MatchedPatterns<"", "">, "">>,
  Expect<Equal<MatchedPatterns<"/1", "/:userId">, "/:userId">>,
  Expect<
    Equal<MatchedPatterns<"/1", "/:userId" | "/:orgId">, "/:userId" | "/:orgId">
  >,
  Expect<
    Equal<
      MatchedPatterns<"/users/1", "/users/:userId" | "/:userId">,
      "/users/:userId" | "/:userId"
    >
  >,
  Expect<
    Equal<
      MatchedPatterns<"/users/1", "/users/:userId" | "/org/:orgId">,
      "/users/:userId"
    >
  >,

  Expect<
    Equal<
      ParseHostAndPort<"example.com">,
      { host: "example.com"; port: undefined }
    >
  >,
  Expect<
    Equal<
      ParseHostAndPort<"example.com:8080">,
      { host: "example.com"; port: "8080" }
    >
  >,
  // If invalid port is specified, it should return never
  Expect<Equal<ParseHostAndPort<"example.com:xxx">, never>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToUrlParamPatternTestCases = [
  Expect<Equal<ToUrlParamPattern<"">, "">>,
  Expect<Equal<ToUrlParamPattern<"/">, "/">>,
  Expect<Equal<ToUrlParamPattern<":a">, string>>,
  Expect<Equal<ToUrlParamPattern<"/:a/b">, `/${string}/b`>>,
  Expect<Equal<ToUrlParamPattern<"/:a/:b">, `/${string}/${string}`>>,
  Expect<
    // @ts-expect-error URL is not supported
    Equal<ToUrlParamPattern<"https://example.com">, `"https://example.com}`>
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToUrlPatternTestCases = [
  Expect<Equal<ToUrlPattern<"">, "">>,
  Expect<Equal<ToUrlPattern<"/">, "/">>,
  Expect<Equal<ToUrlPattern<"/users/:userId">, `/users/${string}`>>,
  Expect<
    Equal<
      ToUrlPattern<"/users/:userId?key=value">,
      `/users/${string}?key=value`
    >
  >,
  // @ts-expect-error URL is not supported
  Expect<Equal<ToUrlPattern<"https://example.com">, "https://example.com">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ParseOriginCases = [
  Expect<Equal<ParseOrigin<undefined>, never>>,
  Expect<
    Equal<
      ParseOrigin<"">,
      { schema: undefined; host: undefined; port: undefined; path: "" }
    >
  >,
  Expect<
    Equal<
      ParseOrigin<"https://example.com/">,
      { host: "example.com"; port: undefined } & { schema: "https"; path: "/" }
    >
  >,
  Expect<
    Equal<
      ParseOrigin<"https://example.com/user">,
      { host: "example.com"; port: undefined } & {
        schema: "https";
        path: "/user";
      }
    >
  >,

  Expect<
    Equal<
      ParseOrigin<"https://example.com/users/:userId">,
      { host: "example.com"; port: undefined } & {
        schema: "https";
        path: "/users/:userId";
      }
    >
  >,

  Expect<
    Equal<
      ParseOrigin<"https://example.com:8080/user">,
      { host: "example.com"; port: "8080" } & { schema: "https"; path: "/user" }
    >
  >,

  Expect<
    Equal<
      ParseOrigin<"/user">,
      { schema: undefined; host: undefined; port: undefined; path: "/user" }
    >
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ParseURLTestCases = [
  Expect<Equal<ParseURL<"/user?a=b">["path"], "/user">>,
  Expect<Equal<ParseURL<"https://example.com/user">["path"], "/user">>,
];
