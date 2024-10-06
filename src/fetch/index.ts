import {
  ApiEndpoints,
  ApiP,
  AnyApiResponses,
  CaseInsensitiveMethod,
  MatchedPatterns,
  MergeApiResponseBodies,
  NormalizePath,
  ParseURL,
  PathToUrlParamPattern,
  Replace,
  StatusCode,
  IsAllOptional,
  ExtractQuery,
  ValidateQuery,
  ToQueryUnion,
  Method,
  CaseInsensitive,
} from "../core";
import { UrlPrefixPattern, ToUrlParamPattern } from "../core";
import { TypedString } from "../json";
import { C } from "../compile-error-utils";

type ValidateUrl<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryDef extends Record<string, unknown> | undefined,
  Url extends string,
  Query extends string | undefined = ExtractQuery<Url>,
  QueryKeys extends string = Query extends string ? ToQueryUnion<Query> : never,
> = ValidateQuery<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  QueryDef extends Record<string, any> ? QueryDef : {},
  QueryKeys
>;

export type RequestInitT<
  CanOmitMethod extends boolean,
  Body extends Record<string, unknown> | string | undefined,
  HeadersObj extends string | Record<string, string> | undefined,
  InputMethod extends CaseInsensitiveMethod,
> = Omit<RequestInit, "method" | "body" | "headers"> &
  (CanOmitMethod extends true
    ? { method?: InputMethod }
    : { method: InputMethod }) &
  (Body extends Record<string, unknown>
    ? IsAllOptional<Body> extends true
      ? { body?: Body | TypedString<Body> }
      : { body: TypedString<Body> }
    : Body extends string
      ? { body: string }
      : // eslint-disable-next-line @typescript-eslint/ban-types
        {}) &
  (HeadersObj extends Record<string, string>
    ? IsAllOptional<HeadersObj> extends true
      ? { headers?: HeadersObj | Headers }
      : { headers: HeadersObj | Headers }
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {});

/**
 * FetchT is a type for window.fetch like function but more strict type information
 *
 * @template UrlPrefix - url prefix of `Input`
 * For example, if `UrlPrefix` is "https://example.com", then `Input` must be `https://example.com/${string}`
 *
 * @template E - ApiEndpoints
 * E is used to infer the type of the acceptable path, response body, and more
 */
type FetchT<UrlPrefix extends UrlPrefixPattern, E extends ApiEndpoints> = <
  /**
   * internal type for FetchT
   *
   * @template UrlPattern - Acceptable url pattern
   * for example, if endpoints is defined as below:
   * { "/users": ..., "/users/:userId": ... }
   * then UrlPattern will be "/users" | "/users/:userId"
   *
   * @template InputPath - Extracted path from `Input`
   *
   * @template CandidatePaths - Matched paths from `InputPath` and `keyof E`
   *
   * @template AcceptableMethods - Acceptable methods for the matched path
   *
   * @template InputMethod - Method of the request
   *
   * @template LM - Lowercase of `InputMethod`
   *
   * @template Query - Query object
   *
   * @template ResBody - Response body
   *
   */
  UrlPattern extends ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>,
  Input extends Query extends undefined
    ? UrlPattern
    : IsAllOptional<Query> extends true
      ? UrlPattern | `${UrlPattern}?${string}`
      : `${UrlPattern}?${string}`,
  InputPath extends PathToUrlParamPattern<
    NormalizePath<
      ParseURL<Replace<Input, ToUrlParamPattern<UrlPrefix>, "">>["path"]
    >
  >,
  CandidatePaths extends MatchedPatterns<
    InputPath,
    keyof E & string
  > = MatchedPatterns<InputPath, keyof E & string>,
  AcceptableMethods extends CandidatePaths extends string
    ? Extract<Method, keyof E[CandidatePaths]>
    : never = CandidatePaths extends string
    ? Extract<Method, keyof E[CandidatePaths]>
    : never,
  InputMethod extends CaseInsensitive<AcceptableMethods> = Extract<
    AcceptableMethods,
    "get"
  >,
  LM extends Lowercase<InputMethod> = Lowercase<InputMethod>,
  Query extends ApiP<E, CandidatePaths, LM, "query"> = ApiP<
    E,
    CandidatePaths,
    LM,
    "query"
  >,
  ResBody extends ApiP<
    E,
    CandidatePaths,
    LM,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<ApiP<E, CandidatePaths, LM, "responses">>
    : Record<StatusCode, never> = ApiP<
    E,
    CandidatePaths,
    LM,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<ApiP<E, CandidatePaths, LM, "responses">>
    : Record<StatusCode, never>,
>(
  input: ValidateUrl<Query, Input> extends C.OK
    ? Input
    : ValidateUrl<Query, Input>,
  init: RequestInitT<
    // If `get` method is defined in the spec, method can be omitted
    "get" extends AcceptableMethods ? true : false,
    ApiP<E, CandidatePaths, LM, "body">,
    ApiP<E, CandidatePaths, LM, "headers">,
    InputMethod
  >,
) => Promise<ResBody>;

export default FetchT;
