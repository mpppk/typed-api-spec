import { Equal, Expect } from "./type-test";
import { ExtractByPrefix, Split } from "./type";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type cases = [
  Expect<Equal<Split<"", "">, []>>,
  Expect<Equal<Split<"a", "">, ["a"]>>,
  Expect<Equal<Split<"ab", "">, ["a", "b"]>>,
  Expect<Equal<Split<"a/b", "/">, ["a", "b"]>>,
  Expect<Equal<Split<"/a/b", "/">, ["", "a", "b"]>>,
  Expect<Equal<Split<"a/b/c", "/">, ["a", "b", "c"]>>,
  Expect<Equal<Split<"a/b/", "/">, ["a", "b", ""]>>,

  Expect<Equal<ExtractByPrefix<"", "">, "">>,
  Expect<Equal<ExtractByPrefix<"a", "">, "a">>,
  Expect<Equal<ExtractByPrefix<"a" | "b", "">, "a" | "b">>,
  Expect<Equal<ExtractByPrefix<"a", ":">, never>>,
  Expect<Equal<ExtractByPrefix<":a", ":">, "a">>,
  Expect<Equal<ExtractByPrefix<":a" | "b", ":">, "a">>,
  Expect<Equal<ExtractByPrefix<"a" | ":b", ":">, "b">>,
  Expect<Equal<ExtractByPrefix<":a" | ":b", ":">, "a" | "b">>,
  Expect<Equal<ExtractByPrefix<":a" | ":b" | ":c", ":">, "a" | "b" | "c">>,
];
