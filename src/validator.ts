import { z } from "zod";
import { ApiSpec } from "./spec";

type SafeParse<Z extends z.ZodTypeAny> = ReturnType<Z["safeParse"]>;
export type Validator<V extends z.ZodTypeAny | undefined> =
  V extends z.ZodTypeAny ? () => ReturnType<V["safeParse"]> : never;
export type Validators<
  AS extends ApiSpec,
  QueryKeys extends string,
> = FilterNever<{
  params: QueryKeys extends never
    ? never
    : AS["params"] extends z.ZodTypeAny
      ? () => SafeParse<AS["params"]>
      : () => SafeParse<z.ZodType<Record<QueryKeys, string>>>;
  query: Validator<AS["query"]>;
  body: Validator<AS["body"]>;
}>;

type FilterNever<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};
