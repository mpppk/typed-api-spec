import * as v from "valibot";
import { BaseApiSpec, Method, StatusCode } from "../common";
import {
  getApiSpec,
  Validator,
  Validators,
  ValidatorsInput,
} from "../common/validate";
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
  ResBody extends Partial<Record<StatusCode, AnyV>> = Partial<
    Record<StatusCode, AnyV>
  >,
  RequestHeaders extends AnyV = AnyV,
  ResponseHeaders extends AnyV = AnyV,
> = BaseApiSpec<Params, Query, Body, ResBody, RequestHeaders, ResponseHeaders>;
export type ToApiEndpoints<E extends ValibotApiEndpoints> = {
  [Path in keyof E & string]: ToApiEndpoint<E, Path>;
};
export type ToApiEndpoint<
  E extends ValibotApiEndpoints,
  Path extends keyof E,
> = {
  [M in keyof E[Path] & Method]: E[Path][M] extends undefined
    ? undefined
    : ToApiSpec<NonNullable<E[Path][M]>>;
};
export type ToApiSpec<ZAS extends ValibotApiSpec> = {
  query: InferOrUndefined<ZAS["query"]>;
  params: InferOrUndefined<ZAS["params"]>;
  body: InferOrUndefined<ZAS["body"]>;
  resBody: ToApiResponses<ZAS["resBody"]>;
  headers: InferOrUndefined<ZAS["headers"]>;
  resHeaders: InferOrUndefined<ZAS["resHeaders"]>;
};
export type ValibotApiResponses = Partial<Record<StatusCode, AnyV>>;
export type ValibotApiResSchema<
  AResponses extends ValibotApiResponses,
  SC extends keyof AResponses & StatusCode,
> = AResponses[SC] extends AnyV ? AResponses[SC] : never;
export type ToApiResponses<AR extends ValibotApiResponses> = {
  [SC in keyof AR & StatusCode]: v.InferOutput<ValibotApiResSchema<AR, SC>>;
};

/**
 * Create a new validator for the given endpoints.
 *
 * @param endpoints API endpoints
 */
export const newValibotValidator = <E extends ValibotApiEndpoints>(
  endpoints: E,
) => {
  return <Path extends keyof E & string, M extends keyof E[Path] & Method>(
    input: ValidatorsInput,
  ) => {
    const { data: spec, error } = getApiSpec(
      endpoints,
      input.path,
      input.method?.toLowerCase(),
    );
    if (error !== undefined) {
      return {} as E[Path][M] extends ValibotApiSpec
        ? ValibotValidators<E[Path][M], "">
        : Record<string, never>;
    }
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
    return zodValidators as E[Path][M] extends ValibotApiSpec
      ? ValibotValidators<E[Path][M], "">
      : Record<string, never>;
  };
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
