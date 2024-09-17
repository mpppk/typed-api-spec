import {
  ApiEndpoints,
  ApiP,
  AnyApiResponses,
  CaseInsensitiveMethod,
  MatchedPatterns,
  MergeApiResponseBodies,
  Method,
  NormalizePath,
  ParseURL,
  PathToUrlParamPattern,
  Replace,
  StatusCode,
  IsAllOptional,
  CaseInsensitive,
} from "../common";
import { UrlPrefixPattern, ToUrlParamPattern } from "../common";
import { TypedString } from "../json";

export type RequestInitT<
  InputMethod extends CaseInsensitiveMethod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | undefined,
  HeadersObj extends Record<string, string> | undefined,
> = Omit<RequestInit, "method" | "body" | "headers"> &
  (InputMethod extends "get" | "GET"
    ? { method?: InputMethod }
    : { method: InputMethod }) &
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Body extends Record<string, any>
    ? IsAllOptional<Body> extends true
      ? { body?: Body | TypedString<Body> }
      : { body: TypedString<Body> }
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
 */
type FetchT<UrlPrefix extends UrlPrefixPattern, E extends ApiEndpoints> = <
  Input extends Query extends undefined
    ? ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>
    : `${ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>}?${string}`,
  InputPath extends PathToUrlParamPattern<
    NormalizePath<
      ParseURL<Replace<Input, ToUrlParamPattern<UrlPrefix>, "">>["path"]
    >
  >,
  CandidatePaths extends string = MatchedPatterns<InputPath, keyof E & string>,
  InputMethod extends CaseInsensitive<keyof E[CandidatePaths] & string> &
    CaseInsensitiveMethod = CaseInsensitive<keyof E[CandidatePaths] & string> &
    CaseInsensitiveMethod,
  M extends Method = CaseInsensitive<"get"> extends InputMethod
    ? "get"
    : Lowercase<InputMethod>,
  Query extends ApiP<E, CandidatePaths, M, "query"> = ApiP<
    E,
    CandidatePaths,
    M,
    "query"
  >,
  ResBody extends ApiP<
    E,
    CandidatePaths,
    M,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<ApiP<E, CandidatePaths, M, "responses">>
    : Record<StatusCode, never> = ApiP<
    E,
    CandidatePaths,
    M,
    "responses"
  > extends AnyApiResponses
    ? MergeApiResponseBodies<ApiP<E, CandidatePaths, M, "responses">>
    : Record<StatusCode, never>,
>(
  input: Input,
  init: RequestInitT<
    InputMethod,
    ApiP<E, CandidatePaths, M, "body">,
    ApiP<E, CandidatePaths, M, "headers">
  >,
) => Promise<ResBody>;

export default FetchT;
