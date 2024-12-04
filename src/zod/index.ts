import { SafeParseReturnType, z, ZodError, ZodType } from "zod";
import {
  BaseApiSpec,
  DefineApiResponses,
  DefineResponse,
  Method,
  StatusCode,
} from "../core";
import { createValidator, Validator, Validators } from "../core/validate";
import { Result } from "../utils";

export const anyZ = <T>() => z.any() as ZodType<T>;
export type ZodValidator<V extends z.ZodTypeAny | undefined> =
  V extends z.ZodTypeAny
    ? Validator<
        NonNullable<ReturnType<V["safeParse"]>["data"]>,
        NonNullable<ReturnType<V["safeParse"]>["error"]>
      >
    : undefined;
export type ZodValidators<
  AS extends ZodApiSpec,
  // FIXME
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string,
> = Validators<
  ZodValidator<AS["params"]>,
  ZodValidator<AS["query"]>,
  ZodValidator<AS["body"]>,
  ZodValidator<AS["headers"]>
>;
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
export type ZodApiEndpoint = Partial<Record<Method, ZodApiSpec>>;
export type ZodApiSpec<
  ParamKeys extends string = string,
  Params extends ZodTypeWithKey<NoInfer<ParamKeys>> = ZodTypeWithKey<
    NoInfer<ParamKeys>
  >,
  Query extends z.ZodTypeAny = z.ZodTypeAny,
  Body extends z.ZodTypeAny = z.ZodTypeAny,
  RequestHeaders extends z.ZodTypeAny = z.ZodTypeAny,
  Responses extends ZodAnyApiResponses = ZodAnyApiResponses,
> = BaseApiSpec<Params, Query, Body, RequestHeaders, Responses>;
type ZodAnyApiResponse = DefineResponse<z.ZodTypeAny, z.ZodTypeAny>;
export type ZodAnyApiResponses = DefineApiResponses<ZodAnyApiResponse>;

// -- converter --
export type ToApiEndpoints<E extends ZodApiEndpoints> = {
  [Path in keyof E & string]: ToApiEndpoint<E, Path>;
};
export type ToApiEndpoint<E extends ZodApiEndpoints, Path extends keyof E> = {
  [M in keyof E[Path] & Method]: ToApiSpec<NonNullable<E[Path][M]>>;
};
export type ToApiSpec<ZAS extends ZodApiSpec> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  headers: InferOrUndefined<ZAS["headers"]>;
  responses: ToApiResponses<ZAS["responses"]>;
};
export type ToApiResponses<AR extends ZodAnyApiResponses> = {
  [SC in keyof AR & StatusCode]: {
    body: InferOrUndefined<NonNullable<AR[SC]>["body"]>;
    headers: InferOrUndefined<NonNullable<AR[SC]>["headers"]>;
  };
};

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newZodValidator = <E extends ZodApiEndpoints>(endpoints: E) => {
  return createValidator(
    endpoints,
    (spec: ZodApiSpec, input, key) =>
      toResult(spec[key]!.safeParse(input[key])),
    (spec: ZodApiSpec, input, key) => {
      const schema = spec["responses"][input.statusCode as StatusCode]?.[key];
      // FIXME: schemaがundefinedの場合の処理
      return toResult(schema!.safeParse(input[key]));
    },
  );
};

const toResult = <T, U>(
  res: SafeParseReturnType<U, T>,
): Result<T, ZodError<U>> => {
  if (res.success) {
    return Result.data(res.data);
  } else {
    return Result.error(res.error);
  }
};
