import { Equal, Expect } from "./type-test";
import {
  HasExcessiveQuery,
  HasMissingQuery,
  IsValidQuery,
  NonOptionalKeys,
  ToQueryUnion,
} from "./query-string";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToQueryUnionCase = [
  Expect<Equal<ToQueryUnion<"a=1">, "a">>,
  Expect<Equal<ToQueryUnion<"a=1&b=2">, "a" | "b">>,
  Expect<Equal<ToQueryUnion<"a=1&b=2&a=3">, "a" | "b">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type HasMissingQueryCase = [
  Expect<Equal<HasMissingQuery<{ a: string }, "a">, false>>,
  Expect<Equal<HasMissingQuery<{ a?: string }, "a">, false>>,
  Expect<Equal<HasMissingQuery<{ a?: string }, "b">, false>>,
  Expect<Equal<HasMissingQuery<{ a?: string }, never>, false>>,
  Expect<Equal<HasMissingQuery<{ a: string }, "a" | "b">, false>>,
  Expect<Equal<HasMissingQuery<{ a?: string }, "a" | "b">, false>>,
  Expect<Equal<HasMissingQuery<{ a: string; b?: string }, "a">, false>>,
  Expect<Equal<HasMissingQuery<{ a: string }, "b">, true>>,
  Expect<Equal<HasMissingQuery<{ a: string; b: string }, "b">, true>>,
  Expect<Equal<HasMissingQuery<{ a: string; b?: string }, "b">, true>>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type HasExcessiveQueryCase = [
  Expect<Equal<HasExcessiveQuery<{ a: string }, "a">, false>>,
  Expect<Equal<HasExcessiveQuery<{ a: string }, "b">, true>>,
  Expect<Equal<HasExcessiveQuery<{ a: string }, "a" | "b">, true>>,
  Expect<Equal<HasExcessiveQuery<{ a: string; b: string }, "a" | "b">, false>>,
  Expect<Equal<HasExcessiveQuery<{ a: string; b?: string }, "a" | "b">, false>>,
  Expect<
    Equal<HasExcessiveQuery<{ a: string; b: string }, "a" | "b" | "c">, true>
  >,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type NonOptionalKeysCase = [
  Expect<Equal<NonOptionalKeys<{ a: string }>, "a">>,
  Expect<Equal<NonOptionalKeys<{ a?: string }>, never>>,
  Expect<Equal<NonOptionalKeys<{ a: string; b?: string }>, "a">>,
  Expect<Equal<NonOptionalKeys<{ a: string; b: string }>, "a" | "b">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type IsValidQueryCase = [
  Expect<Equal<IsValidQuery<{ a: string }, "a">, true>>,
  Expect<Equal<IsValidQuery<{ a: string }, "b">, "E: maybe missing query: a">>,
  Expect<
    Equal<
      IsValidQuery<{ a: string }, "a" | "b">,
      "E: maybe excessive query: a" | "E: maybe excessive query: b"
    >
  >,
  Expect<Equal<IsValidQuery<{ a: string; b?: string }, "a">, true>>,
  Expect<Equal<IsValidQuery<{ a: string; b?: string }, "a" | "b">, true>>,
  Expect<
    Equal<
      IsValidQuery<{ a: string; b: string }, "a">,
      "E: maybe missing query: a" | "E: maybe missing query: b"
    >
  >,
  Expect<Equal<IsValidQuery<{ a: string; b: string }, "a" | "b">, true>>,
];
