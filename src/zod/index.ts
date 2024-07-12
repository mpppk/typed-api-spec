import { z, ZodType } from "zod";
import { Method, StatusCode } from "../common";
import { FilterNever } from "../common";

export const anyZ = <T>() => z.any() as ZodType<T>;
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
  headers: ZodValidator<AS["headers"]>;
  resHeaders: ZodValidator<AS["resHeaders"]>;
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
export type ZodApiEndpoints = { [Path in string]: ZodApiEndpoint };
type ZodApiEndpoint = Partial<Record<Method, ZodApiSpec>>;
export interface ZodApiSpec<
  ParamKeys extends string = string,
  Params extends ZodTypeWithKey<NoInfer<ParamKeys>> = ZodTypeWithKey<
    NoInfer<ParamKeys>
  >,
  Query extends z.ZodTypeAny = z.ZodTypeAny,
  Body extends z.ZodTypeAny = z.ZodTypeAny,
  ResBody extends ZodApiResponses = Partial<Record<StatusCode, z.ZodTypeAny>>,
  RequestHeaders extends z.ZodTypeAny = z.ZodTypeAny,
  ResponseHeaders extends z.ZodTypeAny = z.ZodTypeAny,
> {
  query?: Query;
  params?: Params;
  body?: Body;
  resBody: ResBody;
  headers?: RequestHeaders;
  resHeaders?: ResponseHeaders;
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
export type ToApiEndpoint<E extends ZodApiEndpoints, Path extends keyof E> = {
  [M in keyof E[Path] & Method]: E[Path][M] extends undefined
    ? undefined
    : ToApiSpec<NonNullable<E[Path][M]>>;
};
export type ToApiSpec<ZAS extends ZodApiSpec> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  resBody: ToApiResponses<ZAS["resBody"]>;
  headers: InferOrUndefined<ZAS["headers"]>;
  resHeaders: InferOrUndefined<ZAS["resHeaders"]>;
};
export type ToApiResponses<AR extends ZodApiResponses> = {
  [SC in keyof AR & StatusCode]: z.infer<ZodApiResSchema<AR, SC>>;
};
