import { z } from "zod";
import { ApiSpec } from "../common";
import { FilterNever } from "../common";

type SafeParse<Z extends z.ZodTypeAny> = ReturnType<Z["safeParse"]>;
export type Index<V extends z.ZodTypeAny | undefined> = V extends z.ZodTypeAny
  ? () => ReturnType<V["safeParse"]>
  : never;
export type Validators<
  AS extends ApiSpec,
  QueryKeys extends string,
> = FilterNever<{
  params: QueryKeys extends never
    ? never
    : AS["params"] extends z.ZodTypeAny
      ? () => SafeParse<AS["params"]>
      : () => SafeParse<z.ZodType<Record<QueryKeys, string>>>;
  query: Index<AS["query"]>;
  body: Index<AS["body"]>;
}>;
