import { z } from "zod";
import { ApiResponses, Method, ParseUrlParams, StatusCode } from "../common";
import { FilterNever } from "../common";

type SafeParse<Z extends z.ZodTypeAny> = ReturnType<Z["safeParse"]>;
export type ZodValidator<V extends z.ZodTypeAny | undefined> =
  V extends z.ZodTypeAny ? () => ReturnType<V["safeParse"]> : never;
export type ZodValidators<
  AS extends ZodApiSpec,
  QueryKeys extends string,
> = FilterNever<{
  params: QueryKeys extends never
    ? never
    : AS["params"] extends z.ZodTypeAny
      ? () => SafeParse<AS["params"]>
      : () => SafeParse<z.ZodType<Record<QueryKeys, string>>>;
  query: ZodValidator<AS["query"]>;
  body: ZodValidator<AS["body"]>;
}>;

type ZodTypeWithKey<Key extends string> = z.ZodType<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<Key, any>,
  z.ZodTypeDef,
  Record<Key, string>
>;

export interface ZodApiSpec<
  ParamKeys extends string = string,
  Params extends ZodTypeWithKey<NoInfer<ParamKeys>> = ZodTypeWithKey<
    NoInfer<ParamKeys>
  >,
  Query extends z.ZodTypeAny = z.ZodTypeAny,
  Body extends z.ZodTypeAny = z.ZodTypeAny,
  Response extends ApiResponses = Partial<Record<StatusCode, z.ZodTypeAny>>,
> {
  query?: Query;
  params?: Params;
  body?: Body;
  res: Response;
}
export type ZodApiEndpoints = {
  [K in string]: Partial<Record<Method, ZodApiSpec<ParseUrlParams<K>>>>;
};
export type ZodApiBodySchema<
  E extends ZodApiEndpoints,
  Path extends keyof E & string,
  M extends Method,
> = E[Path] extends undefined
  ? undefined
  : E[Path][M] extends undefined
    ? undefined
    : NonNullable<E[Path][M]>["body"] extends undefined
      ? undefined
      : NonNullable<NonNullable<E[Path][M]>["body"]>;
export type InferOrUndefined<T> = T extends z.ZodTypeAny
  ? z.infer<T>
  : undefined;
