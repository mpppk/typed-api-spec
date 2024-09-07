import { SafeParseReturnType, z, ZodError, ZodType } from "zod";
import {
  BaseApiSpec,
  DefineApiResponses,
  DefineResponse,
  Method,
  StatusCode,
} from "../common";
import {
  getApiSpec,
  Validator,
  Validators,
  ValidatorsInput,
} from "../common/validate";
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
  return <Path extends keyof E & string, M extends keyof E[Path] & Method>(
    input: ValidatorsInput,
  ) => {
    const { data: spec, error } = getApiSpec(
      endpoints,
      input.path,
      input.method?.toLowerCase(),
    );
    if (error !== undefined) {
      return {} as E[Path][M] extends ZodApiSpec
        ? ZodValidators<E[Path][M], "">
        : Record<string, never>;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodValidators: Record<string, any> = {};
    const s = spec as Partial<ZodApiSpec>;
    if (s.params !== undefined) {
      const params = s.params;
      zodValidators["params"] = () => toResult(params.safeParse(input.params));
    }
    if (s.query !== undefined) {
      const query = s.query;
      zodValidators["query"] = () => toResult(query.safeParse(input.query));
    }
    if (s.body !== undefined) {
      const body = s.body;
      zodValidators["body"] = () => toResult(body.safeParse(input.body));
    }
    if (s.headers !== undefined) {
      const headers = s.headers;
      zodValidators["headers"] = () =>
        toResult(headers.safeParse(input.headers));
    }
    return zodValidators as E[Path][M] extends ZodApiSpec
      ? ZodValidators<E[Path][M], "">
      : Record<string, never>;
  };
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
