import { Equal, Expect } from "./type-test";
import { ExtractByPrefix, Replace, Split } from "./type";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type SplitTestCases = [
  Expect<Equal<Split<"", "">, []>>,
  Expect<Equal<Split<"a", "">, ["a"]>>,
  Expect<Equal<Split<"ab", "">, ["a", "b"]>>,
  Expect<Equal<Split<"a/b", "/">, ["a", "b"]>>,
  Expect<Equal<Split<"/a/b", "/">, ["", "a", "b"]>>,
  Expect<Equal<Split<"a/b/c", "/">, ["a", "b", "c"]>>,
  Expect<Equal<Split<"a/b/", "/">, ["a", "b", ""]>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ReplaceTestCases = [
  Expect<Equal<Replace<"a", "a", "-">, "-">>,
  Expect<Equal<Replace<"a", "noexist", "-">, "a">>,
  Expect<Equal<Replace<"a", "a", "a">, "a">>,
  Expect<Equal<Replace<"abcd", "ab", "-">, "-cd">>,
  Expect<Equal<Replace<"abcd", "cd", "-">, "ab-">>,
  Expect<Equal<Replace<"abcd", "bc", "-">, "a-d">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExtractByPrefixTestCases = [
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
