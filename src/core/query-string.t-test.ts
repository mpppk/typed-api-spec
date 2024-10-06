import { Equal, Expect } from "./type-test";
import {
  PickExcessiveQuery,
  PickMissingQuery,
  ValidateQuery,
  NonOptionalKeys,
  ToQueryUnion,
  ExcessiveQueryError,
  MissingQueryError,
} from "./query-string";
import { C } from "../compile-error-utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ToQueryUnionCase = [
  Expect<Equal<ToQueryUnion<"a=1">, "a">>,
  Expect<Equal<ToQueryUnion<"a=1&b=2">, "a" | "b">>,
  Expect<Equal<ToQueryUnion<"a=1&b=2&a=3">, "a" | "b">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PickMissingQueryCase = [
  Expect<Equal<PickMissingQuery<{ a: string }, "a">, never>>,
  Expect<Equal<PickMissingQuery<{ a?: string }, "a">, never>>,
  Expect<Equal<PickMissingQuery<{ a?: string }, "b">, never>>,
  Expect<Equal<PickMissingQuery<{ a?: string }, never>, never>>,
  Expect<Equal<PickMissingQuery<{ a: string }, "a" | "b">, never>>,
  Expect<Equal<PickMissingQuery<{ a?: string }, "a" | "b">, never>>,
  Expect<Equal<PickMissingQuery<{ a: string; b?: string }, "a">, never>>,
  Expect<Equal<PickMissingQuery<{ a: string }, "b">, "a">>,
  Expect<Equal<PickMissingQuery<{ a: string; b: string }, "b">, "a">>,
  Expect<Equal<PickMissingQuery<{ a: string; b?: string }, "b">, "a">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PickExcessiveQueryErrorCase = [
  Expect<Equal<PickExcessiveQuery<{ a: 1 }, "a">, never>>,
  Expect<Equal<PickExcessiveQuery<{ a: 1; b: 1 }, "a">, never>>,
  Expect<Equal<PickExcessiveQuery<{ a: 1; b: 1 }, "a" | "b">, never>>,
  Expect<Equal<PickExcessiveQuery<{ a: 1; b: 1 }, "c">, "c">>,
  Expect<Equal<PickExcessiveQuery<{ a: 1; b: 1 }, "c" | "d">, "c" | "d">>,
  Expect<Equal<PickExcessiveQuery<{ a: 1; b: 1 }, "b" | "c">, "c">>,
  Expect<Equal<PickExcessiveQuery<{ a: 1; b?: 1 }, "b">, never>>,
  Expect<Equal<PickExcessiveQuery<{ a: 1; b?: 1 }, "c">, "c">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type NonOptionalKeysCase = [
  Expect<Equal<NonOptionalKeys<{ a: string }>, "a">>,
  Expect<Equal<NonOptionalKeys<{ a?: string }>, never>>,
  Expect<Equal<NonOptionalKeys<{ a: string; b?: string }>, "a">>,
  Expect<Equal<NonOptionalKeys<{ a: string; b: string }>, "a" | "b">>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ValidateQueryCase = [
  Expect<Equal<ValidateQuery<{ a: string }, "a">, C.OK>>,
  Expect<Equal<ValidateQuery<{ a: string }, "b">, MissingQueryError<"a">>>,
  Expect<
    Equal<
      ValidateQuery<{ a: string }, "a" | "b">,
      ExcessiveQueryError<"a" | "b">
    >
  >,
  Expect<Equal<ValidateQuery<{ a: string; b?: string }, "a">, C.OK>>,
  Expect<Equal<ValidateQuery<{ a: string; b?: string }, "a" | "b">, C.OK>>,
  Expect<
    Equal<
      ValidateQuery<{ a: string; b: string }, "a">,
      MissingQueryError<"a" | "b">
    >
  >,
  Expect<Equal<ValidateQuery<{ a: string; b: string }, "a" | "b">, C.OK>>,
];
