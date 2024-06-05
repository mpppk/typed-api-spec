import { z } from "zod";
import { Method, ParseUrlParams, StatusCode } from "../common";
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
export type InferOrUndefined<T> = T extends z.ZodTypeAny
  ? z.infer<T>
  : undefined;

// -- spec --
export type ZodApiEndpoints = {
  [Path in string]: ZodApiEndpoint<Path>;
};
type ZodApiEndpoint<Path> = Partial<
  Record<Method, ZodApiSpec<ParseUrlParams<Path>>>
>;
export interface ZodApiSpec<
  ParamKeys extends string = string,
  Params extends ZodTypeWithKey<NoInfer<ParamKeys>> = ZodTypeWithKey<
    NoInfer<ParamKeys>
  >,
  Query extends z.ZodTypeAny = z.ZodTypeAny,
  Body extends z.ZodTypeAny = z.ZodTypeAny,
  Response extends ZodApiResponses = Partial<Record<StatusCode, z.ZodTypeAny>>,
> {
  query?: Query;
  params?: Params;
  body?: Body;
  res: Response;
}
export type ZodApiResponses = Partial<Record<StatusCode, z.ZodTypeAny>>;
export type ZodApiResSchema<
  AResponses extends ZodApiResponses,
  SC extends keyof AResponses & StatusCode,
> = AResponses[SC] extends z.ZodTypeAny ? AResponses[SC] : never;

// -- converter --
export type ToApiEndpoints<E extends ZodApiEndpoints> = {
  [Path in keyof E & string]: ToApiEndpoint<E, Path>;
};
type ToApiEndpoint<
  E extends ZodApiEndpoints,
  Path extends keyof E,
> = FilterNever<{
  [M in keyof E[Path] & Method]: E[Path][M] extends undefined
    ? never
    : ToApiSpec<NonNullable<E[Path][M]>>;
}>;
type ToApiSpec<ZAS extends ZodApiSpec> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  res: ToApiResponses<ZAS["res"]>;
};
type ToApiResponses<AR extends ZodApiResponses> = {
  [SC in keyof AR & StatusCode]: z.infer<ZodApiResSchema<AR, SC>>;
};
