import { Equal, Expect } from "./type-test";
import {
  ExtractByPrefix,
  FilterNever,
  Replace,
  ReplaceAll,
  Split,
} from "./type";
import { NormalizePath } from "./url";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type FilterNeverCases = [
  // eslint-disable-next-line @typescript-eslint/ban-types
  Expect<Equal<FilterNever<{ a: never }>, {}>>,
  Expect<Equal<FilterNever<{ a: never; b: string }>, { b: string }>>,
];

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
type ReplaceAllTestCases = [
  Expect<Equal<ReplaceAll<"a", "a", "-">, "-">>,
  Expect<Equal<ReplaceAll<"a", "noexist", "-">, "a">>,
  Expect<Equal<ReplaceAll<"a", "a", "a">, "a">>,
  Expect<Equal<ReplaceAll<"abcd", "ab", "-">, "-cd">>,
  Expect<Equal<ReplaceAll<"abcd", "cd", "-">, "ab-">>,
  Expect<Equal<ReplaceAll<"abcd", "bc", "-">, "a-d">>,
  Expect<Equal<ReplaceAll<"aab", "a", "-">, "--b">>,
  Expect<Equal<ReplaceAll<"aba", "a", "-">, "-b-">>,
  Expect<Equal<ReplaceAll<"aabaa", "aa", "-">, "-b-">>,
  Expect<Equal<ReplaceAll<"aaaba", "aa", "-">, "-aba">>,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type NormalizePathTestCases = [
  Expect<Equal<NormalizePath<"users//">, "users/">>,
  Expect<Equal<NormalizePath<"//users">, "/users">>,
  Expect<Equal<NormalizePath<"users//:userId">, "users/:userId">>,
];
