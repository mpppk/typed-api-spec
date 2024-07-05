import {
  ApiEndpoints,
  ApiP,
  CaseInsensitiveMethod,
  MatchedPatterns,
  MergeApiResponses,
  Method,
  NormalizePath,
  ParseURL,
  PathToUrlParamPattern,
  Replace,
} from "../common";
import { UrlPrefixPattern, ToUrlParamPattern } from "../common";
import { TypedString } from "../json";

export interface RequestInitT<
  InputMethod extends CaseInsensitiveMethod,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Body extends Record<string, any> | undefined,
  HeadersObj extends Record<string, string> | undefined,
> extends RequestInit {
  method?: InputMethod;
  body?: TypedString<Body>;
  // FIXME: no optional
  headers?: HeadersObj extends Record<string, string>
    ? HeadersObj | Headers
    : never;
}

/**
 * FetchT is a type for window.fetch like function but more strict type information
 */
type FetchT<UrlPrefix extends UrlPrefixPattern, E extends ApiEndpoints> = <
  Input extends
    | ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>
    | `${ToUrlParamPattern<`${UrlPrefix}${keyof E & string}`>}?${string}`,
  InputPath extends PathToUrlParamPattern<
    NormalizePath<
      ParseURL<Replace<Input, ToUrlParamPattern<UrlPrefix>, "">>["path"]
    >
  >,
  CandidatePaths extends string = MatchedPatterns<InputPath, keyof E & string>,
  InputMethod extends CaseInsensitiveMethod = "get",
  M extends Method = Lowercase<InputMethod>,
>(
  input: Input,
  init?: RequestInitT<
    InputMethod,
    ApiP<E, CandidatePaths, M, "body">,
    ApiP<E, CandidatePaths, M, "headers">
  >,
) => Promise<MergeApiResponses<ApiP<E, CandidatePaths, M, "resBody">>>;

export default FetchT;
