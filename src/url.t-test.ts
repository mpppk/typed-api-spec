import { Equal, Expect } from "./type-test";
import { OriginPattern, ParseOrigin, ParseURL } from "./url";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const o: OriginPattern = "https://example.com";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type cases = [
  Expect<Equal<ParseOrigin<undefined>, never>>,
  Expect<
    Equal<
      ParseOrigin<"">,
      { schema: undefined; host: undefined; port: undefined; path: "" }
    >
  >,
  Expect<
    Equal<
      ParseOrigin<"https://example.com">,
      { host: "example.com"; port: undefined } & { schema: "https"; path: "" }
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

  Expect<Equal<ParseURL<"/user">["path"], "/user">>,
  Expect<Equal<ParseURL<"https://example.com/user">["path"], "/user">>,
];
