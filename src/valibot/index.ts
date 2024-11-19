import * as v from "valibot";
import {
  AnyApiResponses,
  BaseApiSpec,
  DefineApiResponses,
  DefineResponse,
  Method,
  StatusCode,
} from "../core";
import {
  preCheck,
  ResponseValidatorsInput,
  Validator,
  Validators,
  ValidatorsInput,
} from "../core/validate";
import { Result } from "../utils";
import {
  BaseIssue,
  BaseSchema,
  InferIssue,
  InferOutput,
  SafeParseResult,
} from "valibot";

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
  const req = <
    Path extends keyof E & string,
    M extends keyof E[Path] & Method,
    Validator extends E[Path][M] extends ValibotApiSpec
      ? ValibotValidators<E[Path][M], "">
      : Record<string, never>,
  >(
    input: ValidatorsInput,
  ) => {
    const r = preCheck(endpoints, input.path, input.method);
    if (r.error) {
      return { validator: {} as Validator, error: r.error };
    }
    const spec = r.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodValidators: Record<string, any> = {};
    const s = spec as Partial<ValibotApiSpec>;
    if (s.params !== undefined) {
      const params = s.params;
      zodValidators["params"] = () =>
        toResult(v.safeParse(params, input.params));
    }
    if (s.query !== undefined) {
      const query = s.query;
      zodValidators["query"] = () => toResult(v.safeParse(query, input.query));
    }
    if (s.body !== undefined) {
      const body = s.body;
      zodValidators["body"] = () => toResult(v.safeParse(body, input.body));
    }
    if (s.headers !== undefined) {
      const headers = s.headers;
      zodValidators["headers"] = () =>
        toResult(v.safeParse(headers, input.headers));
    }
    return { validator: zodValidators as Validator, error: null };
  };
  const res = <
    Path extends keyof E & string,
    M extends keyof E[Path] & Method,
    Validator extends E[Path][M] extends ValibotApiSpec
      ? ValibotValidators<E[Path][M], "">
      : Record<string, never>,
  >(
    input: ResponseValidatorsInput,
  ) => {
    const r = preCheck(endpoints, input.path, input.method);
    if (r.error) {
      return { validator: {} as Validator, error: r.error };
    }
    const spec = r.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodValidators: Record<string, any> = {};
    const resBody = spec?.responses?.[input.statusCode as StatusCode]?.body;
    if (resBody !== undefined) {
      zodValidators["body"] = () => toResult(v.safeParse(resBody, input.body));
    }
    const resHeaders =
      spec?.responses?.[input.statusCode as StatusCode]?.headers;
    if (resHeaders !== undefined) {
      zodValidators["headers"] = () =>
        toResult(v.safeParse(resHeaders, input.headers));
    }
    return {
      validator: zodValidators as Validator,
      error: null,
    };
  };
  return { req, res };
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
