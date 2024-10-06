import { Equal, Expect } from "./type-test";
import {
  HasExcessiveQuery,
  HasMissingQuery,
  CheckQuery,
  NonOptionalKeys,
  ToQueryUnion,
} from "./query-string";
import { C } from "../compile-error-utils";

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
  Expect<Equal<CheckQuery<{ a: string }, "a">, C.OK>>,
  Expect<Equal<CheckQuery<{ a: string }, "b">, C.E<"maybe missing query: a">>>,
  Expect<
    Equal<
      CheckQuery<{ a: string }, "a" | "b">,
      C.E<"maybe excessive query: a" | "maybe excessive query: b">
    >
  >,
  Expect<Equal<CheckQuery<{ a: string; b?: string }, "a">, C.OK>>,
  Expect<Equal<CheckQuery<{ a: string; b?: string }, "a" | "b">, C.OK>>,
  Expect<
    Equal<
      CheckQuery<{ a: string; b: string }, "a">,
      C.E<"maybe missing query: a" | "maybe missing query: b">
    >
  >,
  Expect<Equal<CheckQuery<{ a: string; b: string }, "a" | "b">, C.OK>>,
];
