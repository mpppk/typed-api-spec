import { z, ZodType } from "zod";
import { Method, StatusCode } from "../common";
import { FilterNever } from "../common";
import { getApiSpec, ValidatorsInput } from "../common/validate";

export const anyZ = <T>() => z.any() as ZodType<T>;
type SafeParse<Z extends z.ZodTypeAny> = ReturnType<Z["safeParse"]>;
export type ZodValidator<V extends z.ZodTypeAny | undefined> =
  V extends z.ZodTypeAny ? () => ReturnType<V["safeParse"]> : never;
export type ZodValidators<
  AS extends ZodApiSpec,
  ParamKeys extends string,
> = FilterNever<{
  params: ParamKeys extends never
    ? never
    : AS["params"] extends z.ZodTypeAny
      ? () => SafeParse<AS["params"]>
      : () => SafeParse<z.ZodType<Record<ParamKeys, string>>>;
  query: ZodValidator<AS["query"]>;
  body: ZodValidator<AS["body"]>;
  headers: ZodValidator<AS["headers"]>;
  // resHeaders: ZodValidator<AS["resHeaders"]>;
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

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newZodValidator = <E extends ZodApiEndpoints>(endpoints: E) => {
  return <Path extends keyof E & string, M extends keyof E[Path] & Method>(
    input: ValidatorsInput<ToApiEndpoints<E>, Path, M>,
  ) => {
    const { data: spec, error } = getApiSpec(
      endpoints,
      input.path,
      input.method,
    );
    if (error !== undefined) {
      return {} as E[Path][M] extends ZodApiSpec
        ? ZodValidators<E[Path][M], "">
        : Record<string, never>;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodValidators: Record<string, any> = {};

    if (spec?.params !== undefined) {
      const params = spec.params;
      zodValidators["params"] = () => params.safeParse(input.params);
    }
    if (spec?.query !== undefined) {
      const query = spec.query;
      zodValidators["query"] = () => query.safeParse(input.query);
    }
    if (spec?.body !== undefined) {
      const body = spec.body;
      zodValidators["body"] = () => body.safeParse(input.body);
    }
    if (spec?.headers !== undefined) {
      const headers = spec.headers;
      zodValidators["headers"] = () => headers.safeParse(input.headers);
    }
    return zodValidators as E[Path][M] extends ZodApiSpec
      ? ZodValidators<E[Path][M], "">
      : Record<string, never>;
  };
};
