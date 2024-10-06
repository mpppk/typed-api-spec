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
  CheckQuery,
  ToQueryUnion,
  Method,
  CaseInsensitive,
} from "../core";
import { UrlPrefixPattern, ToUrlParamPattern } from "../core";
import { TypedString } from "../json";
import { TResult } from "../error";

export type NoPathError = TResult.E<"no matched patterns">;

type CheckUrl<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QueryDef extends Record<string, unknown> | undefined,
  Url extends string,
  Query extends string | undefined = ExtractQuery<Url>,
  QueryKeys extends string = Query extends string ? ToQueryUnion<Query> : never,
> = CheckQuery<
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

// LowerCase Method
export type LCMethod<M extends CaseInsensitiveMethod | NoPathError> =
  M extends CaseInsensitiveMethod ? Lowercase<M> : M;

/**
 * FetchT is a type for window.fetch like function but more strict type information
 */
type FetchT<UrlPrefix extends UrlPrefixPattern, E extends ApiEndpoints> = <
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
  Query extends ApiP<E, CandidatePaths, LCMethod<InputMethod>, "query"> = ApiP<
    E,
    CandidatePaths,
    LCMethod<InputMethod>,
    "query"
  >,
  ResBody extends ApiP<
    E,
    CandidatePaths,
    LCMethod<InputMethod>,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<
        ApiP<E, CandidatePaths, LCMethod<InputMethod>, "responses">
      >
    : Record<StatusCode, never> = ApiP<
    E,
    CandidatePaths,
    LCMethod<InputMethod>,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<
        ApiP<E, CandidatePaths, LCMethod<InputMethod>, "responses">
      >
    : Record<StatusCode, never>,
>(
  input: CheckUrl<Query, Input> extends TResult.OK
    ? Input
    : CheckUrl<Query, Input>,
  init: RequestInitT<
    AcceptableMethods extends "get" ? true : false,
    ApiP<E, CandidatePaths, LCMethod<InputMethod>, "body">,
    ApiP<E, CandidatePaths, LCMethod<InputMethod>, "headers">,
    InputMethod
  >,
) => Promise<ResBody>;

export default FetchT;
