import * as v from "valibot";
import {
  AnyApiResponses,
  BaseApiSpec,
  DefineApiResponses,
  DefineResponse,
  Method,
  StatusCode,
} from "../core";
import { createValidator, Validator } from "../core/validator/validate";
import { Result } from "../utils";
import {
  BaseIssue,
  BaseSchema,
  InferIssue,
  InferOutput,
  SafeParseResult,
} from "valibot";
import { Validators } from "../core/validator/request";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyV = BaseSchema<any, any, any>;

export type ValibotValidator<V extends AnyV | undefined> = V extends AnyV
  ? Validator<v.InferOutput<V>, v.InferIssue<V>>
  : undefined;
export type ValibotValidators<
  AS extends ValibotApiSpec,
  // FIXME
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string,
> = Validators<
  ValibotValidator<AS["params"]>,
  ValibotValidator<AS["query"]>,
  ValibotValidator<AS["body"]>,
  ValibotValidator<AS["headers"]>
>;
export type InferOrUndefined<T> = T extends AnyV ? v.InferOutput<T> : undefined;

export type ValibotApiEndpoints = { [Path in string]: ValibotApiEndpoint };
type ValibotApiEndpoint = Partial<Record<Method, ValibotApiSpec>>;
export type ValibotApiSpec<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ParamKeys extends string = string,
  Params extends AnyV = AnyV,
  Query extends AnyV = AnyV,
  Body extends AnyV = AnyV,
  RequestHeaders extends AnyV = AnyV,
  Responses extends AnyApiResponses = AnyApiResponses,
> = BaseApiSpec<Params, Query, Body, RequestHeaders, Responses>;
export type ToApiEndpoints<E extends ValibotApiEndpoints> = {
  [Path in keyof E & string]: ToApiEndpoint<E, Path>;
};
export type ToApiEndpoint<
  E extends ValibotApiEndpoints,
  Path extends keyof E,
> = {
  [M in keyof E[Path] & Method]: ToApiSpec<NonNullable<E[Path][M]>>;
};
export type ToApiSpec<ZAS extends ValibotApiSpec> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  headers: InferOrUndefined<ZAS["headers"]>;
  responses: ToApiResponses<ZAS["responses"]>;
};
export type ToApiResponses<AR extends ValibotAnyApiResponses> = {
  [SC in keyof AR & StatusCode]: {
    body: InferOrUndefined<NonNullable<AR[SC]>["body"]>;
    headers: InferOrUndefined<NonNullable<AR[SC]>["headers"]>;
  };
};
type ValibotAnyApiResponse = DefineResponse<AnyV, AnyV>;
export type ValibotAnyApiResponses = DefineApiResponses<ValibotAnyApiResponse>;
export type ValibotApiResponses = Partial<Record<StatusCode, AnyV>>;
export type ValibotApiResSchema<
  AResponses extends ValibotApiResponses,
  SC extends keyof AResponses & StatusCode,
> = AResponses[SC] extends AnyV ? AResponses[SC] : never;

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newValibotValidator = <E extends ValibotApiEndpoints>(
  endpoints: E,
) => {
  return createValidator(
    endpoints,
    (spec: ValibotApiSpec, input, key) =>
      toResult(v.safeParse(spec[key]!, input[key])),
    (spec: ValibotApiSpec, input, key) => {
      const schema = spec["responses"][input.statusCode as StatusCode]?.[key];
      // FIXME: schemaがundefinedの場合の処理
      return toResult(v.safeParse(schema!, input[key]));
    },
  );
};

const toResult = <T extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(
  res: SafeParseResult<T>,
): Result<InferOutput<T>, [InferIssue<T>, ...InferIssue<T>[]]> => {
  if (res.success) {
    return Result.data(res.output);
  } else {
    return Result.error(res.issues);
  }
};
